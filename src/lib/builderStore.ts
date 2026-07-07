import { create } from "zustand";

export type TransformMode = "translate" | "rotate" | "scale";
export type AnimationType = "none" | "spin" | "float" | "pulse";

interface BuilderState {
  projectName: string;
  setProjectName: (name: string) => void;

  modelUrl: string | null;
  modelFile: File | null;
  modelName: string | null;
  setModel: (file: File) => void;
  setModelFromUrl: (url: string, name: string) => void;
  clearModel: () => void;

  markerUrl: string | null;       // preview blob URL
  markerFile: File | null;        // original image file
  markerMindUrl: string | null;   // uploaded .mind file URL (for AR viewer)
  setMarker: (file: File) => void;
  setMarkerMindUrl: (url: string) => void;
  clearMarker: () => void;

  transformMode: TransformMode;
  setTransformMode: (mode: TransformMode) => void;

  scale: number;
  setScale: (s: number) => void;
  animation: AnimationType;
  setAnimation: (a: AnimationType) => void;

  isPublished: boolean;
  publishedSlug: string | null;
  setPublished: (slug: string) => void;

  baseUrl: string;
  setBaseUrl: (url: string) => void;

  activePanel: "model" | "marker" | "settings";
  setActivePanel: (p: "model" | "marker" | "settings") => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  projectName: "Untitled experience",
  setProjectName: (name) => set({ projectName: name }),

  modelUrl: null,
  modelFile: null,
  modelName: null,
  setModel: (file) => set({ modelFile: file, modelUrl: URL.createObjectURL(file), modelName: file.name }),
  setModelFromUrl: (url, name) => set({ modelUrl: url, modelFile: null, modelName: name }),
  clearModel: () => set({ modelUrl: null, modelFile: null, modelName: null }),

  markerUrl: null,
  markerFile: null,
  markerMindUrl: null,
  setMarker: (file) => set({ markerFile: file, markerUrl: URL.createObjectURL(file), markerMindUrl: null }),
  setMarkerMindUrl: (url) => set({ markerMindUrl: url }),
  clearMarker: () => set({ markerUrl: null, markerFile: null, markerMindUrl: null }),

  transformMode: "translate",
  setTransformMode: (mode) => set({ transformMode: mode }),

  scale: 1.0,
  setScale: (s) => set({ scale: s }),
  animation: "none",
  setAnimation: (a) => set({ animation: a }),

  isPublished: false,
  publishedSlug: null,
  setPublished: (slug) => set({ isPublished: true, publishedSlug: slug }),

  baseUrl: "",
  setBaseUrl: (url) => set({ baseUrl: url.replace(/\/$/, "") }),

  activePanel: "model",
  setActivePanel: (p) => set({ activePanel: p }),
}));
