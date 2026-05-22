import { useAppStore } from '../../store/appStore'

const MODEL_ID = 'us.stability.stable-image-control-structure-v1:0'
const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21', '5:4', '4:5']

export default function ControlStructureSettings() {
  const { modelParams, updateModelParams } = useAppStore()
  const params = modelParams[MODEL_ID]
  const update = (key, value) => updateModelParams(MODEL_ID, { [key]: value })

  return (
    <div className="space-y-4">
      <SliderField label="Control Strength" value={params.controlStrength} min={0} max={1.0} step={0.05}
        onChange={(v) => update('controlStrength', v)} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Aspect Ratio</label>
        <select
          value={params.aspectRatio}
          onChange={(e) => update('aspectRatio', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {ASPECT_RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Seed (0 = random)</label>
        <input
          type="number"
          value={params.seed}
          onChange={(e) => update('seed', parseInt(e.target.value) || 0)}
          min={0} max={4294967295}
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
