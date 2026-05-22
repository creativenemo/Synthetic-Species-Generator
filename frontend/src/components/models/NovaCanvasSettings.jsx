import { useAppStore } from '../../store/appStore'

const MODEL_ID = 'amazon.nova-canvas-v1:0'
const SIZES = ['512x512', '768x768', '1024x1024', '1024x768', '768x1024']

export default function NovaCanvasSettings() {
  const { modelParams, updateModelParams } = useAppStore()
  const params = modelParams[MODEL_ID]
  const update = (key, value) => updateModelParams(MODEL_ID, { [key]: value })

  const sizeStr = `${params.width}x${params.height}`

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
        <div className="flex gap-2">
          {['TEXT_IMAGE', 'IMAGE_VARIATION'].map((t) => (
            <button
              key={t}
              onClick={() => update('taskType', t)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                params.taskType === t ? 'bg-primary-100 border-primary-500 text-primary-700' : 'border-gray-300 text-gray-600'
              }`}
            >
              {t === 'TEXT_IMAGE' ? 'Text to Image' : 'Image Variation'}
            </button>
          ))}
        </div>
      </div>

      {params.taskType === 'IMAGE_VARIATION' && (
        <SliderField label="Similarity Strength" value={params.similarityStrength} min={0.2} max={1.0} step={0.05}
          onChange={(v) => update('similarityStrength', v)} />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
        <div className="flex gap-2">
          {['standard', 'premium'].map((q) => (
            <button
              key={q}
              onClick={() => update('quality', q)}
              className={`px-3 py-1.5 text-sm rounded-lg border capitalize ${
                params.quality === q ? 'bg-primary-100 border-primary-500 text-primary-700' : 'border-gray-300 text-gray-600'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Output Size</label>
        <select
          value={sizeStr}
          onChange={(e) => {
            const [w, h] = e.target.value.split('x').map(Number)
            update('width', w); update('height', h)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <SliderField label="CFG Scale" value={params.cfgScale} min={1.1} max={10.0} step={0.1}
        onChange={(v) => update('cfgScale', v)} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Seed (0 = random)</label>
        <input
          type="number"
          value={params.seed}
          onChange={(e) => update('seed', parseInt(e.target.value) || 0)}
          min={0} max={858993459}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
    </div>
  )
}

function SliderField({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <label className="font-medium text-gray-700">{label}</label>
        <span className="text-gray-500">{value}</span>
      </div>
      <input
        type="range"
        value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
}
