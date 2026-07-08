import { create } from "zustand";

export type TransformMode = "translate" | "rotate" | "scale";
export type AnimationType = "none" | "spin" | "float" | "pulse";
export type OverlayType   = "none" | "image" | "video";

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

  markerUrl: string | null;
  markerFile: File | null;
  markerImageUrl: string | null;
  markerMindUrl: string | null;
  setMarker: (file: File) => void;
  setMarkerImageUrl: (url: string) => void;
  setMarkerMindUrl: (url: string) => void;
  clearMarker: () => void;

  // 2D/video overlay
  overlayType: OverlayType;
  overlayUrl: string | null;        // blob preview
  overlayStorageUrl: string | null; // Supabase URL
  overlayWidth: number;
  overlayHeight: number;
  overlayPosition: { x: number; y: number; z: number };
  setOverlay: (file: File) => void;
  setOverlayStorageUrl: (url: string) => void;
  setOverlayDimensions: (w: number, h: number) => void;
  setOverlayPosition: (pos: { x: number; y: number; z: number }) => void;
  setOverlayFromUrl: (url: string, type: OverlayType) => void;
  clearOverlay: () => void;

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

  activePanel: "model" | "marker" | "overlay" | "settings";
  setActivePanel: (p: "model" | "marker" | "overlay" | "settings") => void;
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

  overlayType: "none",
  overlayUrl: null,
  overlayStorageUrl: null,
  overlayWidth: 1,
  overlayHeight: 0.75,
  overlayPosition: { x: 0, y: 0.01, z: 0 },
  setOverlayPosition: (pos) => set({ overlayPosition: pos }),
  setOverlay: (file) => set({
    overlayType: file.type.startsWith("video") ? "video" : "image",
    overlayUrl: URL.createObjectURL(file),
    overlayStorageUrl: null,
  }),
  setOverlayStorageUrl: (url) => set({ overlayStorageUrl: url }),
  setOverlayDimensions: (w, h) => set({ overlayWidth: w, overlayHeight: h }),
  setOverlayFromUrl: (url, type) => set({ overlayStorageUrl: url, overlayUrl: url, overlayType: type }),
  clearOverlay: () => set({ overlayType: "none", overlayUrl: null, overlayStorageUrl: null, overlayPosition: { x: 0, y: 0.01, z: 0 } }),

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
