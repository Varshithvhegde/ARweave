import { create } from "zustand";

export type TransformMode = "translate" | "rotate" | "scale";
export type AnimationType = "none" | "spin" | "float" | "pulse";

interface BuilderState {
  projectName: string;
  setProjectName: (name: string) => void;

  // 3D Model — blobUrl for preview, rawFile for upload, cdnUrl for CDN models
  modelUrl: string | null;        // preview URL (blob or CDN)
  modelFile: File | null;         // set when user uploads a file
  modelName: string | null;
  setModel: (file: File) => void;
  setModelFromUrl: (url: string, name: string) => void;
  clearModel: () => void;

  // Marker image
  markerUrl: string | null;       // preview URL (blob)
  markerFile: File | null;
  setMarker: (file: File) => void;
  clearMarker: () => void;

  // Transform
  transformMode: TransformMode;
  setTransformMode: (mode: TransformMode) => void;

  // Model properties
  scale: number;
  setScale: (s: number) => void;
  animation: AnimationType;
  setAnimation: (a: AnimationType) => void;

  // Publish state
  isPublished: boolean;
  publishedSlug: string | null;
  setPublished: (slug: string) => void;

  // Base URL for the QR — defaults to window.location.origin, overrideable with ngrok
  baseUrl: string;
  setBaseUrl: (url: string) => void;

  // Active panel
  activePanel: "model" | "marker" | "settings";
  setActivePanel: (p: "model" | "marker" | "settings") => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  projectName: "Untitled experience",
  setProjectName: (name) => set({ projectName: name }),

  modelUrl: null,
  modelFile: null,
  modelName: null,
  setModel: (file) => set({
    modelFile: file,
    modelUrl: URL.createObjectURL(file),
    modelName: file.name,
  }),
  setModelFromUrl: (url, name) => set({ modelUrl: url, modelFile: null, modelName: name }),
  clearModel: () => set({ modelUrl: null, modelFile: null, modelName: null }),

  markerUrl: null,
  markerFile: null,
  setMarker: (file) => set({
    markerFile: file,
    markerUrl: URL.createObjectURL(file),
  }),
  clearMarker: () => set({ markerUrl: null, markerFile: null }),

  transformMode: "translate",
  setTransformMode: (mode) => set({ transformMode: mode }),

  scale: 1.0,
  setScale: (s) => set({ scale: s }),
  animation: "none",
  setAnimation: (a) => set({ animation: a }),

  isPublished: false,
  publishedSlug: null,
  setPublished: (slug) => set({ isPublished: true, publishedSlug: slug }),

  baseUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  setBaseUrl: (url) => set({ baseUrl: url.replace(/\/$/, "") }),

  activePanel: "model",
  setActivePanel: (p) => set({ activePanel: p }),
}));
