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

  modelPosition: { x: number; y: number; z: number };
  setModelPosition: (pos: { x: number; y: number; z: number }) => void;

  // markerUrl     = preview (blob or Supabase image URL) — shown in builder canvas
  // markerImageUrl = uploaded image on Supabase (persists across refresh)
  // markerMindUrl  = compiled .mind file on Supabase (used in AR viewer)
  markerUrl: string | null;
  markerFile: File | null;
  markerImageUrl: string | null;
  markerMindUrl: string | null;
  setMarker: (file: File) => void;
  setMarkerImageUrl: (url: string) => void;
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

  modelPosition: { x: 0, y: 0, z: 0 },
  setModelPosition: (pos) => set({ modelPosition: pos }),

  markerUrl: null,
  markerFile: null,
  markerImageUrl: null,
  markerMindUrl: null,
  setMarker: (file) => set({ markerFile: file, markerUrl: URL.createObjectURL(file), markerImageUrl: null, markerMindUrl: null }),
  setMarkerImageUrl: (url) => set({ markerImageUrl: url, markerUrl: url }),
  setMarkerMindUrl: (url) => set({ markerMindUrl: url }),
  clearMarker: () => set({ markerUrl: null, markerFile: null, markerImageUrl: null, markerMindUrl: null }),

  transformMode: "translate",
  setTransformMode: (mode) => set({ transformMode: mode }),

  scale: 0.3,
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
