import { useAppStore } from '../../store/appStore'

const MODELS = [
  { id: 'amazon.nova-canvas-v1:0', name: 'Nova Canvas', desc: 'Best quality for reference-guided synthesis' },
  { id: 'amazon.titan-image-generator-v2:0', name: 'Titan v2', desc: 'Subject composition into new scenes' },
  { id: 'amazon.titan-image-generator-v1', name: 'Titan v1', desc: 'Cheapest baseline option' },
  { id: 'stability.stable-diffusion-xl-v1', name: 'SDXL', desc: 'Highest detail, most control' },
]

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useAppStore()

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Select Model</h3>
      <div className="grid grid-cols-2 gap-3">
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
