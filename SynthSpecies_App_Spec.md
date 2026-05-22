# SynthSpecies — Full Application Specification
### Synthetic Image Generator for Rare Species using Amazon Bedrock
**Version 1.0 | Author: Tarun Jain | PSU Future Tech Challenge 2026**

---

## 1. App Overview

**Purpose:** A web application that lets researchers upload 5–30 reference images of any rare species, write descriptive prompts, experiment with all Bedrock image generation settings, preview 4 synthetic samples, and then bulk-generate up to 200 synthetic training images which can be viewed in a gallery and downloaded as a ZIP.

**Competition framing:** "Zero-infrastructure synthetic data generation for rare species conservation — enabling AI classifiers to recognise species that lack training data."

**Submission category:** Implementation (working system)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Hosting | S3 static website + CloudFront (HTTPS) |
| Backend | AWS Lambda (Python 3.12) + API Gateway (HTTP API) |
| AI | Amazon Bedrock (region: us-east-1 or us-west-2) |
| Storage | S3 (two buckets: uploads + generated) |
| ZIP creation | Lambda (Python `zipfile` stdlib — no extra deps) |
| IaC | AWS SAM or CDK (Claude Code's choice) |
| Auth | None for demo (add Cognito later if needed) |

---

## 3. Architecture

```
Browser (React SPA)
    │
    ├── Static assets ──────────────────► S3 + CloudFront
    │
    └── API calls (HTTPS)
            │
            ▼
    API Gateway (HTTP API)
            │
            ├── POST /upload         ── Lambda: generate presigned PUT URL
            ├── POST /generate       ── Lambda: call Bedrock, store result in S3
            ├── POST /bulk-generate  ── Lambda: call Bedrock N times, store all in S3
            ├── GET  /images/{jobId} ── Lambda: list generated images for a job
            └── GET  /download/{jobId} ── Lambda: zip all images, return presigned GET URL
                        │
                        ▼
                Amazon Bedrock
                (Nova Canvas / Titan v1 / Titan v2 / SDXL)
                        │
                        ▼
                S3 generated-images bucket
```

---

## 4. S3 Bucket Structure

### Bucket 1: `synthspecies-uploads-{account_id}`
```
uploads/
  {sessionId}/
    ref_01.jpg
    ref_02.jpg
    ...
    ref_30.jpg
```
- CORS enabled for PUT from CloudFront origin
- Lifecycle: delete after 24 hours
- Not public

### Bucket 2: `synthspecies-generated-{account_id}`
```
generated/
  {jobId}/
    preview/
      img_001.png
      img_002.png
      img_003.png
      img_004.png
    bulk/
      img_001.png
      ...
      img_200.png
    metadata.json        ← model used, params, timestamp
    download.zip         ← created on demand by /download endpoint
```
- Lifecycle: delete after 7 days
- Not public — all access via presigned URLs

---

## 5. Frontend Screens

### Screen 1 — Upload Reference Images
- Drag-and-drop zone accepting JPG/PNG, 5–30 files
- Thumbnail grid showing uploaded images with remove (×) button
- File count badge: "12 / 30 images"
- Species name text field (used to prefix prompts and ZIP filename)
- "Next: Configure" button (disabled until ≥ 5 images)
- On submit: call `POST /upload` → get presigned URLs → PUT each file to S3 directly from browser

### Screen 2 — Model & Settings
Left panel — **Model selector** (tabs or dropdown):
- Nova Canvas
- Titan Image Generator v2
- Titan Image Generator v1
- Stable Diffusion XL 1.0

Right panel — **Settings** (changes dynamically based on selected model — see Section 6)

Below settings — **Prompt area:**
- Positive prompt textarea (placeholder: "Leptastrea coral colony, underwater macro photography, reef survey, high detail, natural lighting")
- Negative prompt textarea (placeholder: "blurry, cartoon, illustration, drawing, text, watermark")
- Prompt tips accordion (collapsed by default)

Bottom — **"Generate 4 Previews"** button

### Screen 3 — Preview & Tweak
- 2×2 grid of generated sample images (full size on click)
- "Regenerate 4 Samples" button (re-runs with same or updated settings)
- Settings panel remains visible on the right for live tweaking
- Seed display: shows the seed used for each image (so users can lock a good seed)
- "Lock Seed" toggle per image
- "I'm happy — Generate 200 Images" button → opens confirmation modal showing:
  - Model selected
  - Estimated cost (calculated dynamically from pricing table)
  - Estimated time (~2–3 min)
  - "Confirm & Generate" button

### Screen 4 — Bulk Generation Progress
- Progress bar: "Generating image 47 / 200"
- Live thumbnail grid populating as images arrive (poll `GET /images/{jobId}` every 3 seconds)
- Cancel button (stops further Lambda invocations)
- Images generated in batches of 4–5 (respecting Bedrock per-request limits)

### Screen 5 — Gallery & Download
- Masonry/grid view of all 200 images
- Select All / Deselect All toggle
- Individual checkboxes to exclude bad images
- Image count badge: "194 / 200 selected"
- "Download Selected as ZIP" button → calls `GET /download/{jobId}?selected=img_001,img_003,...`
- ZIP is named: `{species_name}_synthetic_{date}.zip`
- Option to "Start New Session" (clears state, returns to Screen 1)

---

## 6. Bedrock Models — Full Parameter Specifications

### 6.1 Amazon Nova Canvas
**Model ID:** `amazon.nova-canvas-v1:0`
**Bedrock API:** `invoke_model` with `modelId` parameter
**Best for:** Subject-reference generation (best quality for reference-image-guided synthesis)

**Task Types supported by this app:**
- `TEXT_IMAGE` — pure text-to-image (no reference images used)
- `IMAGE_VARIATION` — generates variations informed by uploaded reference images

**Request body structure:**
```json
{
  "taskType": "TEXT_IMAGE" | "IMAGE_VARIATION",

  // If taskType = TEXT_IMAGE:
  "textToImageParams": {
    "text": "<positive prompt>",
    "negativeText": "<negative prompt>"
  },

  // If taskType = IMAGE_VARIATION:
  "imageVariationParams": {
    "images": ["<base64_ref_1>", "<base64_ref_2>"],   // 1–5 reference images
    "text": "<positive prompt>",
    "negativeText": "<negative prompt>",
    "similarityStrength": 0.7    // float 0.2–1.0 (how closely to follow references)
  },

  "imageGenerationConfig": {
    "numberOfImages": 1,         // int 1–5 per request
    "quality": "standard",       // "standard" | "premium"
    "width": 1024,               // multiple of 64, range 320–4096
    "height": 1024,              // multiple of 64, range 320–4096
    "seed": 42,                  // int 0–858993459 (0 = random)
    "cfgScale": 6.5              // float 1.1–10.0
  }
}
```

**UI controls to expose:**
| Control | Type | Range/Options | Default |
|---|---|---|---|
| Task Type | Toggle | TEXT_IMAGE / IMAGE_VARIATION | IMAGE_VARIATION |
| Similarity Strength | Slider | 0.2 – 1.0 | 0.7 |
| Quality | Radio | Standard / Premium | Standard |
| Output Size | Dropdown | 512×512, 768×768, 1024×1024, 1024×768, 768×1024 | 1024×1024 |
| CFG Scale | Slider | 1.1 – 10.0 | 6.5 |
| Seed | Number input | 0 – 858993459 | 0 (random) |
| Num Reference Images Used | Slider | 1–5 (from uploaded pool) | all up to 5 |

**Response:**
```json
{
  "images": ["<base64_png>", ...],
  "error": null
}
```

**Pricing:** ~$0.006/image (standard), ~$0.012/image (premium)

---

### 6.2 Amazon Titan Image Generator G1 v2
**Model ID:** `amazon.titan-image-generator-v2:0`
**Best for:** Subject composition — inserts species subject into new backgrounds

**Task Types supported by this app:**
- `TEXT_IMAGE`
- `IMAGE_VARIATION`
- `SUBJECT_IMAGE_COMPOSITION` — places the species from reference images into a new scene

**Request body structure:**
```json
{
  "taskType": "TEXT_IMAGE" | "IMAGE_VARIATION" | "SUBJECT_IMAGE_COMPOSITION",

  // If TEXT_IMAGE:
  "textToImageParams": {
    "text": "<positive prompt>",
    "negativeText": "<negative prompt>"
  },

  // If IMAGE_VARIATION:
  "imageVariationParams": {
    "images": ["<base64_ref>"],
    "text": "<positive prompt>",
    "negativeText": "<negative prompt>",
    "similarityStrength": 0.7
  },

  // If SUBJECT_IMAGE_COMPOSITION:
  "subjectImageCompositionParams": {
    "subjectImages": ["<base64_ref_1>", "<base64_ref_2>"],
    "text": "<scene description prompt>",
    "negativeText": "<negative prompt>"
  },

  "imageGenerationConfig": {
    "numberOfImages": 1,       // 1–5
    "quality": "standard",     // "standard" | "premium"
    "width": 1024,             // 512 | 768 | 1024
    "height": 1024,            // 512 | 768 | 1024
    "seed": 0,                 // 0–2147483646
    "cfgScale": 7.0            // 1.1–10.0
  }
}
```

**UI controls to expose:**
| Control | Type | Range/Options | Default |
|---|---|---|---|
| Task Type | Dropdown | TEXT_IMAGE / IMAGE_VARIATION / SUBJECT_IMAGE_COMPOSITION | IMAGE_VARIATION |
| Similarity Strength | Slider | 0.2 – 1.0 | 0.7 |
| Quality | Radio | Standard / Premium | Standard |
| Output Size | Dropdown | 512×512, 768×768, 1024×1024 | 1024×1024 |
| CFG Scale | Slider | 1.1 – 10.0 | 7.0 |
| Seed | Number input | 0 – 2147483646 | 0 (random) |

**Response:** Same as Nova Canvas format.

**Pricing:** ~$0.008/image (standard), ~$0.012/image (premium)

---

### 6.3 Amazon Titan Image Generator G1 v1
**Model ID:** `amazon.titan-image-generator-v1`
**Best for:** Cheapest option; good baseline results

**Task Types supported by this app:**
- `TEXT_IMAGE`
- `IMAGE_VARIATION`

**Request body structure:**
```json
{
  "taskType": "TEXT_IMAGE" | "IMAGE_VARIATION",

  "textToImageParams": {
    "text": "<positive prompt>",
    "negativeText": "<negative prompt>"
  },

  // Or if IMAGE_VARIATION:
  "imageVariationParams": {
    "images": ["<base64_ref>"],
    "text": "<prompt>",
    "negativeText": "<negative prompt>",
    "similarityStrength": 0.7
  },

  "imageGenerationConfig": {
    "numberOfImages": 1,
    "quality": "standard",
    "width": 1024,
    "height": 1024,
    "seed": 0,
    "cfgScale": 7.0
  }
}
```

**UI controls to expose:**
Same as Titan v2 minus the SUBJECT_IMAGE_COMPOSITION option.

**Pricing:** ~$0.008/image (standard)

---

### 6.4 Stability AI Stable Diffusion XL 1.0
**Model ID:** `stability.stable-diffusion-xl-v1`
**Best for:** Highest detail; most parameter control; img2img support

**Note:** SDXL uses a different request format from Titan/Nova. It does NOT have a native "subject reference" task type. Use `init_image` + `image_strength` for img2img (seeding from one reference image).

**Request body structure:**
```json
{
  "text_prompts": [
    { "text": "<positive prompt>", "weight": 1.0 },
    { "text": "<negative prompt>", "weight": -1.0 }
  ],
  "cfg_scale": 7,               // float 0–35
  "steps": 30,                  // int 10–150
  "seed": 0,                    // int 0–4294967295 (0 = random)
  "samples": 1,                 // int 1–10 (use 1 per request for bulk)
  "style_preset": "photographic",

  // For img2img (optional — include only when using a reference image):
  "init_image": "<base64_ref>",
  "init_image_mode": "IMAGE_STRENGTH",
  "image_strength": 0.35,       // float 0.0–1.0 (0=copy init, 1=ignore init)

  // Sampler (optional):
  "sampler": "K_EULER_ANCESTRAL",

  // Output size (must be multiples of 64):
  "width": 1024,
  "height": 1024
}
```

**Style presets (full list for dropdown):**
`photographic`, `analog-film`, `cinematic`, `digital-art`, `enhance`, `fantasy-art`, `isometric`, `line-art`, `low-poly`, `modeling-compound`, `neon-punk`, `origami`, `pixel-art`, `tile-texture`, `3d-model`, `anime`, `comic-book`

**Samplers (full list for dropdown):**
`DDIM`, `DDPM`, `K_DPMPP_2M`, `K_DPMPP_2S_ANCESTRAL`, `K_DPM_2`, `K_DPM_2_ANCESTRAL`, `K_EULER`, `K_EULER_ANCESTRAL`, `K_HEUN`, `K_LMS`

**UI controls to expose:**
| Control | Type | Range/Options | Default |
|---|---|---|---|
| Mode | Toggle | Text-to-Image / Image-to-Image | Image-to-Image |
| Image Strength (img2img) | Slider | 0.0 – 1.0 | 0.35 |
| CFG Scale | Slider | 0 – 35 | 7 |
| Steps | Slider | 10 – 150 | 30 |
| Style Preset | Dropdown | (17 options above) | photographic |
| Sampler | Dropdown | (10 options above) | K_EULER_ANCESTRAL |
| Output Size | Dropdown | 512×512, 768×768, 1024×1024 | 1024×1024 |
| Seed | Number input | 0 – 4294967295 | 0 (random) |
| Prompt Weight | Slider | 0.1 – 2.0 | 1.0 |

**Response:**
```json
{
  "result": "success",
  "artifacts": [
    {
      "base64": "<base64_png>",
      "seed": 1234567,
      "finishReason": "SUCCESS"
    }
  ]
}
```

**Pricing:** ~$0.018–$0.040/image depending on steps and resolution

---

## 7. Backend — Lambda Functions

All Lambdas are Python 3.12. Use `boto3` for Bedrock and S3.

### 7.1 `POST /upload`
**Input:**
```json
{ "sessionId": "abc123", "fileNames": ["ref_01.jpg", "ref_02.jpg"] }
```
**Logic:**
- Generate one presigned S3 PUT URL per filename (expires: 10 min)
- Return array of `{ fileName, uploadUrl, s3Key }`

**Output:**
```json
{ "presignedUrls": [{ "fileName": "ref_01.jpg", "uploadUrl": "https://...", "s3Key": "uploads/abc123/ref_01.jpg" }] }
```

---

### 7.2 `POST /generate`
**Input:**
```json
{
  "sessionId": "abc123",
  "jobId": "preview-xyz",
  "model": "amazon.nova-canvas-v1:0",
  "referenceS3Keys": ["uploads/abc123/ref_01.jpg", "uploads/abc123/ref_02.jpg"],
  "params": { ...model-specific params... },
  "count": 4
}
```
**Logic:**
1. Fetch reference images from S3, base64-encode them
2. Build model-specific request body from `params`
3. Call `bedrock_runtime.invoke_model(modelId=model, body=json.dumps(body))`
4. Parse response (handle Titan/Nova vs SDXL format differences — see Section 8)
5. Store each image to `generated/{jobId}/preview/img_00{n}.png` in S3
6. Return presigned GET URLs (expires: 1 hour)

**Output:**
```json
{
  "jobId": "preview-xyz",
  "images": [
    { "key": "generated/preview-xyz/preview/img_001.png", "url": "https://..." },
    ...
  ]
}
```
**Lambda config:** 512 MB RAM, 60s timeout

---

### 7.3 `POST /bulk-generate`
**Input:**
```json
{
  "sessionId": "abc123",
  "jobId": "bulk-xyz",
  "model": "amazon.nova-canvas-v1:0",
  "referenceS3Keys": [...],
  "params": { ...model-specific params... },
  "totalCount": 200,
  "batchSize": 4
}
```
**Logic:**
1. Invoke a **Step Functions Express Workflow** (or loop in Lambda with async polling) for 200/batchSize = 50 batches
2. Each batch: call Bedrock with `numberOfImages=batchSize` (or `samples=batchSize` for SDXL)
3. Store results to `generated/{jobId}/bulk/img_{n:03d}.png`
4. Write progress to a DynamoDB item (or simple SSE via API Gateway WebSocket — simpler: client polls)

**Alternative (simpler, no Step Functions):**
- Lambda invokes itself recursively or client polls `GET /images/{jobId}` every 3s
- Lambda has 15-min max timeout — 200 images at ~2s each = ~100s, fits fine in one Lambda

**Lambda config:** 1024 MB RAM, 300s timeout (5 min)

---

### 7.4 `GET /images/{jobId}`
**Logic:**
- List objects in `generated/{jobId}/bulk/` prefix in S3
- Return count + presigned URLs for all completed images

**Output:**
```json
{
  "jobId": "bulk-xyz",
  "completed": 47,
  "total": 200,
  "images": [{ "key": "...", "url": "https://..." }, ...]
}
```

---

### 7.5 `GET /download/{jobId}`
**Query params:** `?selected=img_001,img_003,img_007,...`

**Logic:**
1. Download selected images from S3 into Lambda `/tmp` (10 GB ephemeral storage available)
2. Use Python `zipfile` to create `{species}_{date}.zip`
3. Upload ZIP to `generated/{jobId}/download.zip` in S3
4. Return presigned GET URL (expires: 30 min)

**Lambda config:** 2048 MB RAM, 120s timeout, 2 GB ephemeral storage (`/tmp`)

---

## 8. Model Response Normalisation

Since Titan/Nova and SDXL have different response shapes, normalise in Lambda:

```python
def extract_images(model_id: str, response_body: dict) -> list[bytes]:
    if model_id.startswith("amazon."):
        # Titan / Nova Canvas format
        return [base64.b64decode(img) for img in response_body["images"]]
    elif model_id.startswith("stability."):
        # SDXL format
        return [
            base64.b64decode(a["base64"])
            for a in response_body["artifacts"]
            if a["finishReason"] == "SUCCESS"
        ]
    raise ValueError(f"Unknown model: {model_id}")
```

---

## 9. Environment Variables (Lambda)

```
UPLOADS_BUCKET=synthspecies-uploads-{account_id}
GENERATED_BUCKET=synthspecies-generated-{account_id}
BEDROCK_REGION=us-east-1
PRESIGNED_URL_EXPIRY_SECONDS=3600
CORS_ORIGIN=https://{cloudfront_domain}
```

---

## 10. IAM — Lambda Execution Role Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-canvas-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-image-generator-v1",
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-image-generator-v2:0",
        "arn:aws:bedrock:us-east-1::foundation-model/stability.stable-diffusion-xl-v1"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::synthspecies-uploads-*/*",
        "arn:aws:s3:::synthspecies-generated-*/*",
        "arn:aws:s3:::synthspecies-uploads-*",
        "arn:aws:s3:::synthspecies-generated-*"
      ]
    }
  ]
}
```

**Important:** Models must be **enabled** in the Bedrock console before use.
Go to AWS Console → Bedrock → Model access → Request access for Nova Canvas, Titan Image Generator v1/v2, and Stable Diffusion XL.

---

## 11. CORS Configuration

**S3 uploads bucket CORS:**
```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["PUT", "GET"],
  "AllowedOrigins": ["https://{cloudfront_domain}"],
  "MaxAgeSeconds": 3000
}]
```

**API Gateway:** Enable CORS with `Access-Control-Allow-Origin: https://{cloudfront_domain}` on all routes.

---

## 12. Frontend State Management

Use React Context or Zustand with this shape:

```typescript
interface AppState {
  sessionId: string                    // UUID generated on app load
  speciesName: string
  referenceImages: UploadedImage[]     // { fileName, s3Key, thumbnailUrl }

  selectedModel: ModelId
  modelParams: Record<ModelId, ModelParams>  // persists per-model settings

  previewJobId: string | null
  previewImages: GeneratedImage[]

  bulkJobId: string | null
  bulkImages: GeneratedImage[]
  bulkProgress: { completed: number; total: number }

  currentScreen: 'upload' | 'settings' | 'preview' | 'generating' | 'gallery'
}
```

---

## 13. Cost Estimate

### One full run (200 images)

| Model | Cost per image | 200 images | 4 previews | Total |
|---|---|---|---|---|
| Nova Canvas (standard) | $0.006 | $1.20 | $0.024 | **~$1.22** |
| Nova Canvas (premium) | $0.012 | $2.40 | $0.048 | **~$2.45** |
| Titan v2 (standard) | $0.008 | $1.60 | $0.032 | **~$1.63** |
| Titan v1 (standard) | $0.008 | $1.60 | $0.032 | **~$1.63** |
| SDXL (1024×1024) | $0.040 | $8.00 | $0.16 | **~$8.16** |

### Monthly hosting (competition demo traffic)
| Service | Cost |
|---|---|
| S3 (storage + requests) | ~$0.50 |
| CloudFront | ~$0.10 |
| API Gateway | ~$0.10 |
| Lambda | ~$0.00 (free tier) |
| **Total** | **< $1/month** |

---

## 14. Key Implementation Notes for Claude Code

1. **Model access must be pre-enabled** in AWS Console → Bedrock → Model access before any API call will succeed. Add a note in the README.

2. **SDXL image size:** SDXL requires width and height to be multiples of 64, and performs best at exactly 1024×1024. Do not offer non-standard sizes for SDXL.

3. **Bulk generation batching:** Nova Canvas and Titan support `numberOfImages: 1–5` per API call. SDXL supports `samples: 1–10`. For bulk generation, use the max per call to minimise Lambda invocations and latency:
   - Nova/Titan: call with `numberOfImages=5`, repeat 40 times → 200 images
   - SDXL: call with `samples=5`, repeat 40 times → 200 images

4. **Reference image selection for bulk:** During bulk generation, randomly sample from the uploaded reference pool on each request to get variety (don't use the same 1 reference 200 times).

5. **Seed handling:** For preview, let the user see and optionally lock the seed per image. For bulk, increment the seed by 1 each batch OR set to 0 (random) for maximum diversity.

6. **ZIP Lambda `/tmp` size:** Lambda `/tmp` defaults to 512 MB. 200 PNG images at ~500 KB each = ~100 MB — fits fine. Set ephemeral storage to 1024 MB in SAM/CDK to be safe.

7. **Bedrock endpoint:** Use `boto3.client("bedrock-runtime", region_name="us-east-1")` — NOT the `bedrock` client (which is for admin). The invoke call is:
   ```python
   response = bedrock.invoke_model(
       modelId="amazon.nova-canvas-v1:0",
       body=json.dumps(request_body),
       contentType="application/json",
       accept="application/json"
   )
   result = json.loads(response["body"].read())
   ```

8. **Progress polling:** Client polls `GET /images/{jobId}` every 3 seconds. No WebSocket needed. Lambda for bulk-generate runs synchronously and Lambda has a 15-min max — 200 images will complete in ~100–200 seconds well within this limit.

9. **S3 presigned URLs:** All image delivery uses presigned GET URLs (1 hour expiry). Never make the S3 buckets public.

10. **Error handling:** Bedrock occasionally returns `ThrottlingException` or `ModelErrorException`. Implement exponential backoff (max 3 retries) in the generate Lambda.

---

## 15. Folder Structure (Frontend)

```
frontend/
  src/
    components/
      screens/
        UploadScreen.jsx
        SettingsScreen.jsx
        PreviewScreen.jsx
        GeneratingScreen.jsx
        GalleryScreen.jsx
      models/
        NovaCanvasSettings.jsx
        TitanV2Settings.jsx
        TitanV1Settings.jsx
        SDXLSettings.jsx
      shared/
        ImageGrid.jsx
        PromptEditor.jsx
        ProgressBar.jsx
        ModelSelector.jsx
    api/
      upload.js
      generate.js
      download.js
    store/
      appStore.js
    App.jsx
    main.jsx
  public/
  index.html
  vite.config.js
  tailwind.config.js
```

## 16. Folder Structure (Backend)

```
backend/
  functions/
    upload/
      handler.py
    generate/
      handler.py
      bedrock_client.py     ← model-specific request builders + response normaliser
      models/
        nova_canvas.py
        titan_v1.py
        titan_v2.py
        sdxl.py
    bulk_generate/
      handler.py
    list_images/
      handler.py
    download_zip/
      handler.py
  template.yaml             ← SAM template (or cdk/ directory if using CDK)
  requirements.txt          ← boto3 (already in Lambda runtime, but pin version)
```

---

## 17. README Checklist (for deployment)

- [ ] Enable Bedrock model access in us-east-1 console for all 4 models
- [ ] Run `sam build && sam deploy --guided` (or `cdk deploy`)
- [ ] Note the CloudFront URL from outputs
- [ ] Run `npm run build && aws s3 sync dist/ s3://{frontend_bucket}` for frontend
- [ ] Set `VITE_API_URL=https://{api_gateway_id}.execute-api.us-east-1.amazonaws.com` in `.env.production`
- [ ] Test upload + preview + bulk + download end-to-end with 5 reference images

---

*End of SynthSpecies App Specification v1.0*
