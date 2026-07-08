import * as THREE from "three";

// Shared mutable refs — SceneCanvas writes, BuilderToolbar reads at publish time
export const sceneRef = {
  group:        null as THREE.Group | null, // 3D model group
  overlayGroup: null as THREE.Group | null, // overlay image group
  rootGroup:    null as THREE.Group | null, // root that contains ALL objects — exported as single GLB
};
