def build_request(params, reference_images, batch_size):
    text = params.get("text", "")
    negative_text = params.get("negativeText", "")
    seed = params.get("seed", 0)
    control_strength = params.get("controlStrength", 0.7)
    aspect_ratio = params.get("aspectRatio", "1:1")
    output_format = params.get("outputFormat", "png")

    body = {
        "prompt": text,
        "negative_prompt": negative_text,
        "aspect_ratio": aspect_ratio,
        "control_strength": control_strength,
        "output_format": output_format,
    }

    if seed > 0:
        body["seed"] = seed

    if reference_images:
        body["image"] = reference_images[0]

    return body
