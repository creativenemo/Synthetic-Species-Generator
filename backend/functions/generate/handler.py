import json
import os
import uuid
import base64
import boto3

from bedrock_client import invoke_model, extract_images

s3 = boto3.client("s3")
UPLOADS_BUCKET = os.environ["UPLOADS_BUCKET"]
GENERATED_BUCKET = os.environ["GENERATED_BUCKET"]
BEDROCK_REGION = os.environ.get("BEDROCK_REGION", "us-east-1")
EXPIRY = int(os.environ.get("PRESIGNED_URL_EXPIRY_SECONDS", "3600"))


def lambda_handler(event, context):
    body = json.loads(event.get("body", "{}"))
    session_id = body.get("sessionId")
    job_id = body.get("jobId") or f"preview-{uuid.uuid4().hex[:8]}"
    model = body.get("model")
    reference_keys = body.get("referenceS3Keys", [])
    params = body.get("params", {})
    count = min(body.get("count", 4), 5)

    if not session_id or not model:
        return _response(400, {"error": "sessionId and model required"})

    reference_images = _fetch_references(reference_keys)

    bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
    result_images = []
    remaining = count

    while remaining > 0:
        batch_size = min(remaining, 5)
        response_body = invoke_model(
            bedrock, model, params, reference_images, batch_size
        )
        result_images.extend(extract_images(model, response_body))
        remaining -= batch_size

    output = []
    for i, img_bytes in enumerate(result_images[:count], 1):
        key = f"generated/{job_id}/preview/img_{i:03d}.png"
        s3.put_object(Bucket=GENERATED_BUCKET, Key=key, Body=img_bytes, ContentType="image/png")
        url = s3.generate_presigned_url(
            "get_object", Params={"Bucket": GENERATED_BUCKET, "Key": key}, ExpiresIn=EXPIRY
        )
        output.append({"key": key, "url": url})

    return _response(200, {"jobId": job_id, "images": output})


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
