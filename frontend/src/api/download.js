import { apiGet } from './client'

export async function getDownloadUrl(jobId, selectedImages) {
  const params = selectedImages ? `?selected=${selectedImages.join(',')}` : ''
  return apiGet(`/download/${jobId}${params}`)
}
