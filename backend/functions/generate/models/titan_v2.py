def build_request(params, reference_images, batch_size):
    task_type = params.get("taskType", "IMAGE_VARIATION")
    text = params.get("text", "")
    negative_text = params.get("negativeText", "")
    width = params.get("width", 1024)
    height = params.get("height", 1024)
    quality = params.get("quality", "standard")
    cfg_scale = params.get("cfgScale", 7.0)
    seed = params.get("seed", 0)
    similarity = params.get("similarityStrength", 0.7)

    body = {
        "taskType": task_type,
        "imageGenerationConfig": {
            "numberOfImages": batch_size,
            "quality": quality,
            "width": width,
            "height": height,
            "cfgScale": cfg_scale,
            "seed": seed,
        },
    }

    if task_type == "TEXT_IMAGE":
        body["textToImageParams"] = {
            "text": text,
            "negativeText": negative_text,
        }
    elif task_type == "IMAGE_VARIATION":
        body["imageVariationParams"] = {
            "images": reference_images[:1],
            "text": text,
            "negativeText": negative_text,
            "similarityStrength": similarity,
        }
    elif task_type == "SUBJECT_IMAGE_COMPOSITION":
        body["subjectImageCompositionParams"] = {
            "subjectImages": reference_images[:2],
            "text": text,
            "negativeText": negative_text,
        }

    return body
