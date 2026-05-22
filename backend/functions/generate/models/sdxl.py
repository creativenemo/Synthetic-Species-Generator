def build_request(params, reference_images, batch_size):
    text = params.get("text", "")
    negative_text = params.get("negativeText", "")
    cfg_scale = params.get("cfgScale", 7)
    steps = params.get("steps", 30)
    seed = params.get("seed", 0)
    style_preset = params.get("stylePreset", "photographic")
    sampler = params.get("sampler", "K_EULER_ANCESTRAL")
    width = params.get("width", 1024)
    height = params.get("height", 1024)
    image_strength = params.get("imageStrength", 0.35)
    prompt_weight = params.get("promptWeight", 1.0)
    mode = params.get("mode", "IMAGE_TO_IMAGE")

    body = {
        "text_prompts": [
            {"text": text, "weight": prompt_weight},
            {"text": negative_text, "weight": -1.0},
        ],
        "cfg_scale": cfg_scale,
        "steps": steps,
        "seed": seed,
        "samples": batch_size,
        "style_preset": style_preset,
        "sampler": sampler,
        "width": width,
        "height": height,
    }

    if mode == "IMAGE_TO_IMAGE" and reference_images:
        body["init_image"] = reference_images[0]
        body["init_image_mode"] = "IMAGE_STRENGTH"
        body["image_strength"] = image_strength

    return body
