import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import { bulkGenerate, listImages } from '../../api/generate'
import ProgressBar from '../shared/ProgressBar'

export default function GeneratingScreen() {
  const { sessionId, selectedModel, modelParams, referenceImages, bulkProgress, setBulkProgress, setBulkImages, setScreen } =
    useAppStore()
  const [error, setError] = useState(null)
  const [thumbnails, setThumbnails] = useState([])
  const [cancelled, setCancelled] = useState(false)
  const pollRef = useRef(null)
  const jobIdRef = useRef(null)

  const params = modelParams[selectedModel]

  useEffect(() => {
    startBulkGeneration()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const startBulkGeneration = async () => {
    const jobId = `bulk-${crypto.randomUUID().slice(0, 8)}`
    jobIdRef.current = jobId
    setBulkProgress({ completed: 0, total: 200 })

    pollRef.current = setInterval(async () => {
      try {
        const status = await listImages(jobId)
        setBulkProgress({ completed: status.completed, total: 200 })
        setThumbnails(status.images.slice(-8))

        if (status.completed >= 200) {
          clearInterval(pollRef.current)
          setBulkImages(jobId, status.images)
          setScreen('gallery')
        }
      } catch {}
    }, 3000)

    try {
      const refKeys = referenceImages.map((i) => i.s3Key).filter(Boolean)
      await bulkGenerate({
        sessionId,
        jobId,
        model: selectedModel,
        referenceS3Keys: refKeys,
        params,
        totalCount: 200,
        batchSize: 5,
      })
      clearInterval(pollRef.current)
      const final = await listImages(jobId)
      setBulkImages(jobId, final.images)
      setScreen('gallery')
    } catch (err) {
      if (!cancelled) setError(err.message)
      clearInterval(pollRef.current)
    }
  }

  const handleCancel = () => {
    setCancelled(true)
    if (pollRef.current) clearInterval(pollRef.current)
    setScreen('preview')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Generating Images</h2>
        <p className="text-gray-600 mt-1">Bulk generation in progress...</p>
      </div>

      <ProgressBar completed={bulkProgress.completed} total={bulkProgress.total} />

      {error && <p className="text-red-600">{error}</p>}

      {thumbnails.length > 0 && (
        <div className="grid grid-cols-4 gap-3 max-w-xl">
          {thumbnails.map((img, i) => (
            <img key={i} src={img.url} alt="" className="w-full aspect-square object-cover rounded-lg" />
          ))}
        </div>
      )}

      <button
        onClick={handleCancel}
        className="px-6 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
