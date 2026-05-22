import { apiPost, apiGet } from './client'

export async function generatePreview({ sessionId, jobId, model, referenceS3Keys, params, count = 4 }) {
  return apiPost('/generate', { sessionId, jobId, model, referenceS3Keys, params, count })
}

export async function bulkGenerate({ sessionId, jobId, model, referenceS3Keys, params, totalCount = 200, batchSize = 5 }) {
  return apiPost('/bulk-generate', { sessionId, jobId, model, referenceS3Keys, params, totalCount, batchSize })
}

export async function listImages(jobId) {
  return apiGet(`/images/${jobId}`)
}
