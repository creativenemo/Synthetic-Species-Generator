# SynthSpecies — Synthetic Image Generator for Rare Species

Web application that generates synthetic training images for rare species using Amazon Bedrock image generation models.

## Prerequisites

- AWS account with Bedrock model access enabled for:
  - Amazon Nova Canvas (`amazon.nova-canvas-v1:0`)
  - Amazon Titan Image Generator v1 (`amazon.titan-image-generator-v1`)
  - Amazon Titan Image Generator v2 (`amazon.titan-image-generator-v2:0`)
  - Stability AI SDXL (`stability.stable-diffusion-xl-v1`)
- AWS SAM CLI installed
- Node.js 18+
- Python 3.12

**Important:** Enable model access in AWS Console → Bedrock → Model access → Request access for all 4 models before deploying.

## Local Development

### Backend

```bash
cd backend
sam build
sam local start-api --port 3001
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on http://localhost:3000 and proxies API calls to SAM local on port 3001.

## Deploy to AWS

```bash
cd backend
sam build
sam deploy --guided
```

After deploy, note the API URL from outputs, then:

```bash
cd frontend
echo "VITE_API_URL=https://{api-gateway-id}.execute-api.us-east-1.amazonaws.com/prod" > .env.production
npm run build
aws s3 sync dist/ s3://{frontend-bucket-name}
```

## Architecture

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** AWS Lambda (Python 3.12) + API Gateway
- **AI:** Amazon Bedrock (4 models)
- **Storage:** S3 (uploads bucket + generated images bucket)
- **IaC:** AWS SAM
