"use client";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

/**
 * Exports a Three.js Group (or any Object3D) to a GLB ArrayBuffer.
 * The exported GLB is self-contained — all textures are embedded.
 */
export function exportSceneToGLB(object: THREE.Object3D): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          // JSON mode fallback — convert to ArrayBuffer
          const json = JSON.stringify(result);
          const buf  = new TextEncoder().encode(json).buffer;
          resolve(buf);
        }
      },
      (error) => reject(error),
      {
        binary: true,          // export as .glb not .gltf
        embedImages: true,     // embed textures inline
        forceIndices: true,
        truncateDrawRange: false,
      }
    );
  });
}
