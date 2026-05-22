import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import { generatePreview } from '../../api/generate'

const COST_PER_IMAGE = {
  'amazon.nova-canvas-v1:0': { standard: 0.006, premium: 0.012 },
  'amazon.titan-image-generator-v2:0': { standard: 0.008, premium: 0.012 },
  'amazon.titan-image-generator-v1': { standard: 0.008, premium: 0.008 },
  'stability.stable-diffusion-xl-v1': { standard: 0.04, premium: 0.04 },
}

export default function PreviewScreen() {
  const { sessionId, selectedModel, modelParams, referenceImages, previewImages, setPreviewImages, setScreen } =
    useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const didRun = useRef(false)

  const params = modelParams[selectedModel]

  const doGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const state = useAppStore.getState()
      const refKeys = state.referenceImages.map((i) => i.s3Key).filter(Boolean)
      const result = await generatePreview({
        sessionId: state.sessionId,
        model: state.selectedModel,
        referenceS3Keys: refKeys,
        params: state.modelParams[state.selectedModel],
        count: 4,
      })
      setPreviewImages(result.jobId, result.images)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!didRun.current && previewImages.length === 0) {
      didRun.current = true
      doGenerate()
    }
  }, [])

  const quality = params.quality || 'standard'
  const costPerImage = COST_PER_IMAGE[selectedModel]?.[quality] || 0.01
  const estimatedCost = (costPerImage * 200).toFixed(2)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Preview Samples</h2>
        <p className="text-gray-600 mt-1">Review generated samples and adjust settings</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-600">Generating previews...</span>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && previewImages.length > 0 && (
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          {previewImages.map((img, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <img src={img.url} alt={`Preview ${i + 1}`} className="w-full aspect-square object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setScreen('settings')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Back to Settings
        </button>
        <button
          onClick={doGenerate}
          disabled={loading}
          className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors disabled:opacity-50"
        >
          Regenerate 4 Samples
        </button>
        <button
          onClick={() => setShowModal(true)}
          disabled={loading || previewImages.length === 0}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          Generate 200 Images
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold">Confirm Bulk Generation</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Model:</span> {selectedModel}</p>
              <p><span className="font-medium">Estimated cost:</span> ~${estimatedCost}</p>
              <p><span className="font-medium">Estimated time:</span> 2–3 minutes</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowModal(false); setScreen('generating') }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Confirm & Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
