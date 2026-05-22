import { create } from 'zustand'

const generateSessionId = () => crypto.randomUUID()

const DEFAULT_MODEL_PARAMS = {
  'amazon.nova-canvas-v1:0': {
    taskType: 'IMAGE_VARIATION',
    similarityStrength: 0.7,
    quality: 'standard',
    width: 1024,
    height: 1024,
    cfgScale: 6.5,
    seed: 0,
    text: '',
    negativeText: '',
  },
  'amazon.titan-image-generator-v2:0': {
    taskType: 'IMAGE_VARIATION',
    similarityStrength: 0.7,
    quality: 'standard',
    width: 1024,
    height: 1024,
    cfgScale: 7.0,
    seed: 0,
    text: '',
    negativeText: '',
  },
  'amazon.titan-image-generator-v1': {
    taskType: 'IMAGE_VARIATION',
    similarityStrength: 0.7,
    quality: 'standard',
    width: 1024,
    height: 1024,
    cfgScale: 7.0,
    seed: 0,
    text: '',
    negativeText: '',
  },
  'stability.stable-diffusion-xl-v1': {
    mode: 'IMAGE_TO_IMAGE',
    imageStrength: 0.35,
    cfgScale: 7,
    steps: 30,
    seed: 0,
    stylePreset: 'photographic',
    sampler: 'K_EULER_ANCESTRAL',
    width: 1024,
    height: 1024,
    promptWeight: 1.0,
    text: '',
    negativeText: '',
  },
}

export const useAppStore = create((set, get) => ({
  sessionId: generateSessionId(),
  speciesName: '',
  referenceImages: [],

  selectedModel: 'amazon.nova-canvas-v1:0',
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
