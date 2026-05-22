import { useAppStore } from '../../store/appStore'

const MODELS = [
  { id: 'us.stability.stable-image-style-guide-v1:0', name: 'Style Guide', desc: 'Reference-guided generation — best for species synthesis' },
  { id: 'us.stability.stable-image-control-structure-v1:0', name: 'Control Structure', desc: 'Preserves structural composition from reference' },
  { id: 'us.stability.stable-image-control-sketch-v1:0', name: 'Control Sketch', desc: 'Generates from sketch/outline of reference' },
]

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useAppStore()

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Select Model</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${
              selectedModel === m.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="font-medium text-sm">{m.name}</p>
            <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
