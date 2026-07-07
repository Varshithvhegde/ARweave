"use client";
import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls, Environment, Grid, TransformControls, useGLTF, Center
} from "@react-three/drei";
import type { TransformControls as TCType } from "three-stdlib";
import { useBuilderStore } from "@/lib/builderStore";

function ModelMesh({ url, mode }: { url: string; mode: "translate" | "rotate" | "scale" }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef(null);
  const tcRef = useRef<TCType>(null);

  return (
    <group>
      <TransformControls ref={tcRef} mode={mode} object={meshRef.current ?? undefined}>
        <Center ref={meshRef}>
          <primitive object={scene.clone()} />
        </Center>
      </TransformControls>
    </group>
  );
}

function PlaceholderBox({ mode }: { mode: "translate" | "rotate" | "scale" }) {
  const meshRef = useRef(null);

  return (
    <TransformControls mode={mode} object={meshRef.current ?? undefined}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.3} metalness={0.1} />
      </mesh>
    </TransformControls>
  );
}

export default function SceneCanvas() {
  const { modelUrl, transformMode } = useBuilderStore();

  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 50 }}
      shadows
      className="w-full h-full"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow />
      <pointLight position={[-4, 3, -4]} intensity={0.4} color="#a78bfa" />

      <Suspense fallback={null}>
        {modelUrl ? (
          <ModelMesh url={modelUrl} mode={transformMode} />
        ) : (
          <PlaceholderBox mode={transformMode} />
        )}
        <Environment preset="city" />
      </Suspense>

      <Grid
        args={[12, 12]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionColor="#9ca3af"
        sectionSize={4}
        fadeDistance={20}
        infiniteGrid
        receiveShadow
      />

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
