import json
import os
import boto3

s3 = boto3.client("s3")
GENERATED_BUCKET = os.environ["GENERATED_BUCKET"]
EXPIRY = int(os.environ.get("PRESIGNED_URL_EXPIRY_SECONDS", "3600"))


def lambda_handler(event, context):
    job_id = event.get("pathParameters", {}).get("jobId")
    if not job_id:
        return _response(400, {"error": "jobId required"})

    prefix = f"generated/{job_id}/bulk/"
    response = s3.list_objects_v2(Bucket=GENERATED_BUCKET, Prefix=prefix)
    objects = response.get("Contents", [])

    images = []
    for obj in objects:
        key = obj["Key"]
        if key.endswith(".png"):
            url = s3.generate_presigned_url(
                "get_object", Params={"Bucket": GENERATED_BUCKET, "Key": key}, ExpiresIn=EXPIRY
            )
            images.append({"key": key, "url": url})

    total_marker_prefix = f"generated/{job_id}/"
    total = 200

    return _response(200, {
        "jobId": job_id,
        "completed": len(images),
        "total": total,
        "images": images,
    })


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
