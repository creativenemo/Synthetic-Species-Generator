import json
import os
import sys
import random
import base64
import time
import boto3

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "generate"))
from bedrock_client import invoke_model, extract_images

s3 = boto3.client("s3")
UPLOADS_BUCKET = os.environ["UPLOADS_BUCKET"]
GENERATED_BUCKET = os.environ["GENERATED_BUCKET"]
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")


def lambda_handler(event, context):
    body = json.loads(event.get("body", "{}"))
    session_id = body.get("sessionId")
    job_id = body.get("jobId")
    model = body.get("model")
    reference_keys = body.get("referenceS3Keys", [])
    params = body.get("params", {})
    total_count = min(body.get("totalCount", 200), 200)
    batch_size = min(body.get("batchSize", 5), 5)

    if not all([session_id, job_id, model]):
        return _response(400, {"error": "sessionId, jobId, and model required"})

    all_references = _fetch_references(reference_keys)
    bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)

    generated = 0
    img_index = 1
    seed = params.get("seed", 0)

    while generated < total_count:
        current_batch = min(batch_size, total_count - generated)

        batch_params = {**params}
        if seed > 0:
            batch_params["seed"] = seed + generated
        else:
            batch_params["seed"] = 0

        ref_sample = _sample_references(all_references, model)

        response_body = invoke_model(bedrock, model, batch_params, ref_sample, current_batch)
        images = extract_images(model, response_body)

        for img_bytes in images:
            key = f"generated/{job_id}/bulk/img_{img_index:03d}.png"
            s3.put_object(
                Bucket=GENERATED_BUCKET, Key=key, Body=img_bytes, ContentType="image/png"
            )
            img_index += 1

        generated += len(images)

    return _response(200, {"jobId": job_id, "completed": generated, "total": total_count})


def _fetch_references(keys):
    images = []
    for key in keys:
        obj = s3.get_object(Bucket=UPLOADS_BUCKET, Key=key)
        images.append(base64.b64encode(obj["Body"].read()).decode("utf-8"))
    return images


def _sample_references(all_refs, model):
    if not all_refs:
        return []
    if model == "stability.stable-diffusion-xl-v1":
        return [random.choice(all_refs)]
    max_refs = 5 if model == "amazon.nova-canvas-v1:0" else 2
    count = min(len(all_refs), max_refs)
    return random.sample(all_refs, count)


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
