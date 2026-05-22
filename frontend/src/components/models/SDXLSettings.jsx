import { useAppStore } from '../../store/appStore'

const MODEL_ID = 'stability.stable-diffusion-xl-v1'
const SIZES = ['512x512', '768x768', '1024x1024']
const STYLE_PRESETS = [
  'photographic', 'analog-film', 'cinematic', 'digital-art', 'enhance',
  'fantasy-art', 'isometric', 'line-art', 'low-poly', 'modeling-compound',
  'neon-punk', 'origami', 'pixel-art', 'tile-texture', '3d-model', 'anime', 'comic-book',
]
const SAMPLERS = [
  'DDIM', 'DDPM', 'K_DPMPP_2M', 'K_DPMPP_2S_ANCESTRAL', 'K_DPM_2',
  'K_DPM_2_ANCESTRAL', 'K_EULER', 'K_EULER_ANCESTRAL', 'K_HEUN', 'K_LMS',
]

export default function SDXLSettings() {
  const { modelParams, updateModelParams } = useAppStore()
  const params = modelParams[MODEL_ID]
  const update = (key, value) => updateModelParams(MODEL_ID, { [key]: value })

  const sizeStr = `${params.width}x${params.height}`

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
        <div className="flex gap-2">
          {['TEXT_TO_IMAGE', 'IMAGE_TO_IMAGE'].map((m) => (
            <button
              key={m}
              onClick={() => update('mode', m)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                params.mode === m ? 'bg-primary-100 border-primary-500 text-primary-700' : 'border-gray-300 text-gray-600'
              }`}
            >
              {m.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {params.mode === 'IMAGE_TO_IMAGE' && (
        <SliderField label="Image Strength" value={params.imageStrength} min={0} max={1.0} step={0.05}
          onChange={(v) => update('imageStrength', v)} />
      )}

      <SliderField label="CFG Scale" value={params.cfgScale} min={0} max={35} step={0.5}
        onChange={(v) => update('cfgScale', v)} />

      <SliderField label="Steps" value={params.steps} min={10} max={150} step={1}
        onChange={(v) => update('steps', v)} />

      <SliderField label="Prompt Weight" value={params.promptWeight} min={0.1} max={2.0} step={0.1}
        onChange={(v) => update('promptWeight', v)} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style Preset</label>
        <select
          value={params.stylePreset}
          onChange={(e) => update('stylePreset', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {STYLE_PRESETS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sampler</label>
        <select
          value={params.sampler}
          onChange={(e) => update('sampler', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {SAMPLERS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
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
