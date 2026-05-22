import { create } from 'zustand'

const generateSessionId = () => crypto.randomUUID()

const DEFAULT_MODEL_PARAMS = {
  'us.stability.stable-image-style-guide-v1:0': {
    fidelity: 0.7,
    aspectRatio: '1:1',
    seed: 0,
    text: '',
    negativeText: '',
  },
  'us.stability.stable-image-control-structure-v1:0': {
    controlStrength: 0.7,
    aspectRatio: '1:1',
    seed: 0,
    text: '',
    negativeText: '',
  },
  'us.stability.stable-image-control-sketch-v1:0': {
    controlStrength: 0.7,
    aspectRatio: '1:1',
    seed: 0,
    text: '',
    negativeText: '',
  },
}

export const useAppStore = create((set, get) => ({
  sessionId: generateSessionId(),
  speciesName: '',
  referenceImages: [],

  selectedModel: 'us.stability.stable-image-style-guide-v1:0',
  modelParams: { ...DEFAULT_MODEL_PARAMS },

  previewJobId: null,
  previewImages: [],

  bulkJobId: null,
  bulkImages: [],
  bulkProgress: { completed: 0, total: 0 },

  currentScreen: 'upload',

  setSpeciesName: (name) => set({ speciesName: name }),
  setReferenceImages: (images) => set({ referenceImages: images }),
  addReferenceImage: (image) => set((s) => ({ referenceImages: [...s.referenceImages, image] })),
  removeReferenceImage: (fileName) =>
    set((s) => ({ referenceImages: s.referenceImages.filter((i) => i.fileName !== fileName) })),

  setSelectedModel: (model) => set({ selectedModel: model }),
  updateModelParams: (model, params) =>
    set((s) => ({
      modelParams: { ...s.modelParams, [model]: { ...s.modelParams[model], ...params } },
    })),

  setPreviewImages: (jobId, images) => set({ previewJobId: jobId, previewImages: images }),
  setBulkProgress: (progress) => set({ bulkProgress: progress }),
  setBulkImages: (jobId, images) => set({ bulkJobId: jobId, bulkImages: images }),
  addBulkImages: (images) => set((s) => ({ bulkImages: [...s.bulkImages, ...images] })),

  setScreen: (screen) => set({ currentScreen: screen }),

  resetSession: () =>
    set({
      sessionId: generateSessionId(),
      speciesName: '',
      referenceImages: [],
      previewJobId: null,
      previewImages: [],
      bulkJobId: null,
      bulkImages: [],
      bulkProgress: { completed: 0, total: 0 },
      currentScreen: 'upload',
      modelParams: { ...DEFAULT_MODEL_PARAMS },
    }),
}))
