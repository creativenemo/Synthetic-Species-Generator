import { apiPost } from './client'

export async function getUploadUrls(sessionId, fileNames) {
  return apiPost('/upload', { sessionId, fileNames })
}

export async function uploadFileToS3(file, presignedUrl) {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
}
