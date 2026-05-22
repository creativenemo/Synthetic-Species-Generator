import { useAppStore } from '../../store/appStore'
import ModelSelector from '../shared/ModelSelector'
import PromptEditor from '../shared/PromptEditor'
import NovaCanvasSettings from '../models/NovaCanvasSettings'
import TitanV2Settings from '../models/TitanV2Settings'
import TitanV1Settings from '../models/TitanV1Settings'
import SDXLSettings from '../models/SDXLSettings'

const MODEL_SETTINGS = {
  'amazon.nova-canvas-v1:0': NovaCanvasSettings,
  'amazon.titan-image-generator-v2:0': TitanV2Settings,
  'amazon.titan-image-generator-v1': TitanV1Settings,
  'stability.stable-diffusion-xl-v1': SDXLSettings,
}

export default function SettingsScreen() {
  const { selectedModel, setScreen } = useAppStore()
  const SettingsPanel = MODEL_SETTINGS[selectedModel]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Model & Settings</h2>
        <p className="text-gray-600 mt-1">Choose a model and configure generation parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ModelSelector />
          <PromptEditor />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">Model Parameters</h3>
          <SettingsPanel />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setScreen('upload')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setScreen('preview')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Generate 4 Previews
        </button>
      </div>
    </div>
  )
}
