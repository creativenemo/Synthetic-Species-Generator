import { useAppStore } from '../../store/appStore'

export default function PromptEditor() {
  const { selectedModel, modelParams, updateModelParams } = useAppStore()
  const params = modelParams[selectedModel]

  const update = (key, value) => updateModelParams(selectedModel, { [key]: value })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Positive Prompt</label>
        <textarea
          value={params.text || ''}
          onChange={(e) => update('text', e.target.value)}
          placeholder="Leptastrea coral colony, underwater macro photography, reef survey, high detail, natural lighting"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Negative Prompt</label>
        <textarea
          value={params.negativeText || ''}
          onChange={(e) => update('negativeText', e.target.value)}
          placeholder="blurry, cartoon, illustration, drawing, text, watermark"
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
        />
      </div>
    </div>
  )
}
