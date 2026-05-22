import { useAppStore } from './store/appStore'
import UploadScreen from './components/screens/UploadScreen'
import SettingsScreen from './components/screens/SettingsScreen'
import PreviewScreen from './components/screens/PreviewScreen'
import GeneratingScreen from './components/screens/GeneratingScreen'
import GalleryScreen from './components/screens/GalleryScreen'

const SCREENS = {
  upload: UploadScreen,
  settings: SettingsScreen,
  preview: PreviewScreen,
  generating: GeneratingScreen,
  gallery: GalleryScreen,
}

export default function App() {
  const currentScreen = useAppStore((s) => s.currentScreen)
  const Screen = SCREENS[currentScreen]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Synth<span className="text-primary-600">Species</span>
          </h1>
          <StepIndicator current={currentScreen} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Screen />
      </main>
    </div>
  )
}

const STEPS = ['upload', 'settings', 'preview', 'generating', 'gallery']
const STEP_LABELS = ['Upload', 'Configure', 'Preview', 'Generate', 'Gallery']

function StepIndicator({ current }) {
  const idx = STEPS.indexOf(current)
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i <= idx ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
          <span className={`ml-1 text-sm hidden sm:inline ${i <= idx ? 'text-gray-900' : 'text-gray-400'}`}>
            {STEP_LABELS[i]}
          </span>
          {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-300 mx-2" />}
        </div>
      ))}
    </div>
  )
}
