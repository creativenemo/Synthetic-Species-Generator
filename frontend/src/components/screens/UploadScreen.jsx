import { useState, useCallback } from 'react'
import { useAppStore } from '../../store/appStore'
import { getUploadUrls, uploadFileToS3 } from '../../api/upload'

export default function UploadScreen() {
  const { sessionId, speciesName, referenceImages, setSpeciesName, setReferenceImages, removeReferenceImage, setScreen } =
    useAppStore()
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFiles = useCallback(
    (files) => {
      const valid = Array.from(files).filter(
        (f) => f.type === 'image/jpeg' || f.type === 'image/png'
      )
      const total = referenceImages.length + valid.length
      if (total > 30) {
        setError('Maximum 30 images allowed')
        return
      }
      const newImages = valid.map((f) => ({
        file: f,
        fileName: f.name,
        thumbnailUrl: URL.createObjectURL(f),
        s3Key: null,
      }))
      setReferenceImages([...referenceImages, ...newImages])
      setError(null)
    },
    [referenceImages, setReferenceImages]
  )

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleUploadAndNext = async () => {
    setUploading(true)
    setError(null)
    try {
      const fileNames = referenceImages.map((i) => i.fileName)
      const { presignedUrls } = await getUploadUrls(sessionId, fileNames)

      const updated = await Promise.all(
        referenceImages.map(async (img, idx) => {
          const { uploadUrl, s3Key } = presignedUrls[idx]
          await uploadFileToS3(img.file, uploadUrl)
          return { ...img, s3Key }
        })
      )

      setReferenceImages(updated)
      setScreen('settings')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Upload Reference Images</h2>
        <p className="text-gray-600 mt-1">Upload 5–30 reference images of your species (JPG/PNG)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Species Name</label>
        <input
          type="text"
          value={speciesName}
          onChange={(e) => setSpeciesName(e.target.value)}
          placeholder="e.g. Leptastrea Coral"
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white'
        }`}
      >
        <p className="text-gray-600 mb-2">Drag & drop images here, or</p>
        <label className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors">
          Browse Files
          <input
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {referenceImages.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            {referenceImages.length} / 30 images
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {referenceImages.map((img) => (
              <div key={img.fileName} className="relative group">
                <img
                  src={img.thumbnailUrl}
                  alt={img.fileName}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <button
                  onClick={() => removeReferenceImage(img.fileName)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleUploadAndNext}
        disabled={referenceImages.length < 5 || uploading || !speciesName.trim()}
        className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
      >
        {uploading ? 'Uploading...' : 'Next: Configure'}
      </button>
    </div>
  )
}
