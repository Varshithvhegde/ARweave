import { create } from "zustand";

export type TransformMode = "translate" | "rotate" | "scale";
export type AnimationType = "none" | "spin" | "float" | "pulse";

interface BuilderState {
  // Project
  projectName: string;
  setProjectName: (name: string) => void;

  // 3D Model
  modelUrl: string | null;
  setModelUrl: (url: string | null) => void;

  // Marker image
  markerUrl: string | null;
  setMarkerUrl: (url: string | null) => void;

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

  // Active panel
  activePanel: "model" | "marker" | "settings";
  setActivePanel: (p: "model" | "marker" | "settings") => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  projectName: "Untitled experience",
  setProjectName: (name) => set({ projectName: name }),

  modelUrl: null,
  setModelUrl: (url) => set({ modelUrl: url }),

  markerUrl: null,
  setMarkerUrl: (url) => set({ markerUrl: url }),

  transformMode: "translate",
  setTransformMode: (mode) => set({ transformMode: mode }),

  scale: 1.0,
  setScale: (s) => set({ scale: s }),
  animation: "none",
  setAnimation: (a) => set({ animation: a }),

  isPublished: false,
  publishedSlug: null,
  setPublished: (slug) => set({ isPublished: true, publishedSlug: slug }),

  activePanel: "model",
  setActivePanel: (p) => set({ activePanel: p }),
}));
