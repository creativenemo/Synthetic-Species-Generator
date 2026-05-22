import json
import os
import uuid
import base64
import boto3

from bedrock_client import invoke_model, extract_images

s3 = boto3.client("s3")
lambda_client = boto3.client("lambda")
UPLOADS_BUCKET = os.environ["UPLOADS_BUCKET"]
GENERATED_BUCKET = os.environ["GENERATED_BUCKET"]
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")
EXPIRY = int(os.environ.get("PRESIGNED_URL_EXPIRY_SECONDS", "3600"))
FUNCTION_NAME = os.environ.get("AWS_LAMBDA_FUNCTION_NAME", "")


def lambda_handler(event, context):
    if event.get("_internal"):
        return _do_generate(event["_internal"])

    body = json.loads(event.get("body", "{}"))
    session_id = body.get("sessionId")
    job_id = body.get("jobId") or f"preview-{uuid.uuid4().hex[:8]}"
    model = body.get("model")
    reference_keys = body.get("referenceS3Keys", [])
    params = body.get("params", {})
    count = min(body.get("count", 4), 5)

    if not session_id or not model:
        return _response(400, {"error": "sessionId and model required"})

    # Otherwise, invoke self async and return immediately
    for i in range(count):
        payload = {
            "_internal": {
                "jobId": job_id,
                "model": model,
                "referenceKeys": reference_keys,
                "params": params,
                "imageIndex": i + 1,
                "refIndex": i,
            }
        }
        lambda_client.invoke(
            FunctionName=FUNCTION_NAME,
            InvocationType="Event",
            Payload=json.dumps(payload),
        )

    return _response(202, {"jobId": job_id, "total": count, "status": "generating"})


def _do_generate(config):
    job_id = config["jobId"]
    model = config["model"]
    reference_keys = config["referenceKeys"]
    params = config["params"]
    image_index = config["imageIndex"]
    ref_index = config["refIndex"]

    reference_images = _fetch_references(reference_keys)
    ref_for_call = [reference_images[ref_index % len(reference_images)]] if reference_images else []

    bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
    response_body = invoke_model(bedrock, model, params, ref_for_call, 1)
    images = extract_images(model, response_body)

    if images:
        key = f"generated/{job_id}/preview/img_{image_index:03d}.png"
        s3.put_object(Bucket=GENERATED_BUCKET, Key=key, Body=images[0], ContentType="image/png")


def _fetch_references(keys):
    images = []
    for key in keys:
        obj = s3.get_object(Bucket=UPLOADS_BUCKET, Key=key)
        images.append(base64.b64encode(obj["Body"].read()).decode("utf-8"))
    return images


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
