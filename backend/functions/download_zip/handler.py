import json
import os
import zipfile
import tempfile
from datetime import datetime
import boto3

s3 = boto3.client("s3")
GENERATED_BUCKET = os.environ["GENERATED_BUCKET"]
EXPIRY = int(os.environ.get("PRESIGNED_URL_EXPIRY_SECONDS", "1800"))


def lambda_handler(event, context):
    job_id = event.get("pathParameters", {}).get("jobId")
    query = event.get("queryStringParameters") or {}
    selected = query.get("selected", "")

    if not job_id:
        return _response(400, {"error": "jobId required"})

    selected_files = [f.strip() for f in selected.split(",") if f.strip()] if selected else None

    prefix = f"generated/{job_id}/bulk/"
    response = s3.list_objects_v2(Bucket=GENERATED_BUCKET, Prefix=prefix)
    objects = response.get("Contents", [])

    keys_to_zip = []
    for obj in objects:
        key = obj["Key"]
        if not key.endswith(".png"):
            continue
        filename = key.split("/")[-1]
        if selected_files and filename.replace(".png", "") not in selected_files:
            continue
        keys_to_zip.append(key)

    if not keys_to_zip:
        return _response(404, {"error": "No images found"})

    date_str = datetime.utcnow().strftime("%Y%m%d")
    zip_filename = f"synthetic_{date_str}.zip"
    tmp_path = os.path.join(tempfile.gettempdir(), zip_filename)

    with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for key in keys_to_zip:
            obj = s3.get_object(Bucket=GENERATED_BUCKET, Key=key)
            data = obj["Body"].read()
            arcname = key.split("/")[-1]
            zf.writestr(arcname, data)

    zip_key = f"generated/{job_id}/download.zip"
    s3.upload_file(tmp_path, GENERATED_BUCKET, zip_key)
    os.remove(tmp_path)

    url = s3.generate_presigned_url(
        "get_object", Params={"Bucket": GENERATED_BUCKET, "Key": zip_key}, ExpiresIn=EXPIRY
    )

    return _response(200, {"downloadUrl": url})


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
