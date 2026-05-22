import json
import os
import boto3
from botocore.config import Config

s3 = boto3.client("s3", config=Config(signature_version="s3v4"))
UPLOADS_BUCKET = os.environ["UPLOADS_BUCKET"]
EXPIRY = int(os.environ.get("PRESIGNED_URL_EXPIRY_SECONDS", "600"))


def lambda_handler(event, context):
    body = json.loads(event.get("body", "{}"))
    session_id = body.get("sessionId")
    file_names = body.get("fileNames", [])

    if not session_id or not file_names:
        return _response(400, {"error": "sessionId and fileNames required"})

    if len(file_names) > 10:
        return _response(400, {"error": "Maximum 10 files allowed"})

    presigned_urls = []
    for name in file_names:
        s3_key = f"uploads/{session_id}/{name}"
        url = s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": UPLOADS_BUCKET, "Key": s3_key},
            ExpiresIn=EXPIRY,
        )
        presigned_urls.append({"fileName": name, "uploadUrl": url, "s3Key": s3_key})

    return _response(200, {"presignedUrls": presigned_urls})


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
