import * as THREE from "three";

// Shared mutable ref — SceneCanvas writes, BuilderToolbar reads at publish time
// No React state, no re-renders, no sync issues
export const sceneRef = {
  group: null as THREE.Group | null,
};
