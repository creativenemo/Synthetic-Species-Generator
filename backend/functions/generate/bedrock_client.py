import json
import base64
import time

from models import nova_canvas, titan_v1, titan_v2, sdxl

MODEL_BUILDERS = {
    "amazon.nova-canvas-v1:0": nova_canvas.build_request,
    "amazon.titan-image-generator-v1": titan_v1.build_request,
    "amazon.titan-image-generator-v2:0": titan_v2.build_request,
    "stability.stable-diffusion-xl-v1": sdxl.build_request,
}

MAX_RETRIES = 3


def invoke_model(bedrock_client, model_id, params, reference_images, batch_size):
    builder = MODEL_BUILDERS.get(model_id)
    if not builder:
        raise ValueError(f"Unknown model: {model_id}")

    request_body = builder(params, reference_images, batch_size)

    for attempt in range(MAX_RETRIES):
        try:
            response = bedrock_client.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body),
                contentType="application/json",
                accept="application/json",
            )
            return json.loads(response["body"].read())
        except bedrock_client.exceptions.ThrottlingException:
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
            else:
                raise


def extract_images(model_id, response_body):
    if model_id.startswith("amazon."):
        return [base64.b64decode(img) for img in response_body["images"]]
    elif model_id.startswith("stability."):
        return [
            base64.b64decode(a["base64"])
            for a in response_body["artifacts"]
            if a["finishReason"] == "SUCCESS"
        ]
    raise ValueError(f"Unknown model: {model_id}")
