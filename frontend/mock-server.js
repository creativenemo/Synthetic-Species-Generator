import express from 'express'
import cors from 'cors'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

const uploads = new Map()
const jobs = new Map()

// POST /upload — return fake presigned URLs (just local upload endpoints)
app.post('/upload', (req, res) => {
  const { sessionId, fileNames } = req.body
  if (!sessionId || !fileNames) {
    return res.status(400).json({ error: 'sessionId and fileNames required' })
  }

  const presignedUrls = fileNames.map((name) => {
    const s3Key = `uploads/${sessionId}/${name}`
    return {
      fileName: name,
      uploadUrl: `http://localhost:3001/mock-put/${sessionId}/${name}`,
      s3Key,
    }
  })

  res.json({ presignedUrls })
})

// Mock PUT endpoint (simulates S3 presigned upload)
app.put('/mock-put/:sessionId/:fileName', express.raw({ type: '*/*', limit: '20mb' }), (req, res) => {
  const key = `uploads/${req.params.sessionId}/${req.params.fileName}`
  uploads.set(key, req.body)
  res.status(200).end()
})

// POST /generate — return placeholder images
app.post('/generate', (req, res) => {
  const { sessionId, model, count = 4 } = req.body
  const jobId = `preview-${randomUUID().slice(0, 8)}`

  const images = Array.from({ length: count }, (_, i) => ({
    key: `generated/${jobId}/preview/img_${String(i + 1).padStart(3, '0')}.png`,
    url: `https://placehold.co/1024x1024/2d6a4f/ffffff?text=Preview+${i + 1}%0A${model?.split('.')[1] || 'model'}`,
  }))

  res.json({ jobId, images })
})

// POST /bulk-generate — simulate async generation
app.post('/bulk-generate', (req, res) => {
  const { jobId, totalCount = 200 } = req.body

  let completed = 0
  const images = []

  const interval = setInterval(() => {
    const batch = Math.min(5, totalCount - completed)
    for (let i = 0; i < batch; i++) {
      completed++
      images.push({
        key: `generated/${jobId}/bulk/img_${String(completed).padStart(3, '0')}.png`,
        url: `https://placehold.co/512x512/2d6a4f/ffffff?text=${completed}`,
      })
    }
    jobs.set(jobId, { completed, total: totalCount, images: [...images] })
    if (completed >= totalCount) clearInterval(interval)
  }, 500)

  jobs.set(jobId, { completed: 0, total: totalCount, images: [] })

  // Respond immediately
  setTimeout(() => {
    res.json({ jobId, completed: totalCount, total: totalCount })
  }, (totalCount / 5) * 500 + 500)
})

// GET /images/:jobId — poll progress
app.get('/images/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId)
  if (!job) {
    return res.json({ jobId: req.params.jobId, completed: 0, total: 200, images: [] })
  }
  res.json({ jobId: req.params.jobId, ...job })
})

// GET /download/:jobId — return fake download URL
app.get('/download/:jobId', (req, res) => {
  res.json({ downloadUrl: `https://placehold.co/100x100?text=ZIP+Download` })
})

app.listen(3001, () => {
  console.log('Mock API server running on http://localhost:3001')
})
