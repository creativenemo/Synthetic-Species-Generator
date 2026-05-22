import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { getDownloadUrl } from '../../api/download'

export default function GalleryScreen() {
  const { bulkJobId, bulkImages, resetSession } = useAppStore()
  const [selected, setSelected] = useState(() => new Set(bulkImages.map((_, i) => i)))
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  const toggleAll = () => {
    if (selected.size === bulkImages.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(bulkImages.map((_, i) => i)))
    }
  }

  const toggleImage = (idx) => {
    const next = new Set(selected)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setSelected(next)
  }

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const selectedNames = Array.from(selected).map((i) => {
        const key = bulkImages[i].key
        return key.split('/').pop().replace('.png', '')
      })
      const { downloadUrl } = await getDownloadUrl(bulkJobId, selectedNames)
      window.open(downloadUrl, '_blank')
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gallery</h2>
          <p className="text-gray-600 mt-1">{selected.size} / {bulkImages.length} selected</p>
        </div>
        <button
          onClick={toggleAll}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {selected.size === bulkImages.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {bulkImages.map((img, i) => (
          <div
            key={i}
            onClick={() => toggleImage(i)}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
              selected.has(i) ? 'border-primary-500' : 'border-transparent'
            }`}
          >
            <img src={img.url} alt="" className="w-full aspect-square object-cover" />
            {selected.has(i) && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={selected.size === 0 || downloading}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {downloading ? 'Preparing ZIP...' : `Download Selected as ZIP`}
        </button>
        <button
          onClick={resetSession}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Start New Session
        </button>
      </div>
    </div>
  )
}
