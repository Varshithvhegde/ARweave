"use client";
import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, TransformControls, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
import { useBuilderStore, type AnimationType } from "@/lib/builderStore";

// Applies animation each frame based on type
function useModelAnimation(groupRef: React.RefObject<THREE.Group | null>, animation: AnimationType) {
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (animation === "spin") {
      groupRef.current.rotation.y += delta * 1.2;
    } else if (animation === "float") {
      groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.15;
    } else if (animation === "pulse") {
      const s = 1 + Math.sin(Date.now() * 0.002) * 0.08;
      groupRef.current.scale.setScalar(s);
    }
  });
}

function GLBModel({ url, mode, scale, animation }: {
  url: string;
  mode: "translate" | "rotate" | "scale";
  scale: number;
  animation: AnimationType;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  useModelAnimation(groupRef, animation);

  // Apply scale when it changes (skip if pulse is animating it)
  useEffect(() => {
    if (groupRef.current && animation !== "pulse") {
      groupRef.current.scale.setScalar(scale);
    }
  }, [scale, animation]);

  return (
    <TransformControls mode={mode}>
      <group ref={groupRef}>
        <Center>
          <primitive object={scene.clone()} />
        </Center>
      </group>
    </TransformControls>
  );
}

function PlaceholderModel({ mode, scale, animation }: {
  mode: "translate" | "rotate" | "scale";
  scale: number;
  animation: AnimationType;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useModelAnimation(groupRef, animation);

  useEffect(() => {
    if (groupRef.current && animation !== "pulse") {
      groupRef.current.scale.setScalar(scale);
    }
  }, [scale, animation]);

  return (
    <TransformControls mode={mode}>
      <group ref={groupRef}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#7c3aed" roughness={0.3} metalness={0.2} />
        </mesh>
      </group>
    </TransformControls>
  );
}

function LoadingBox() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color="#7c3aed" wireframe />
    </mesh>
  );
}

export default function SceneCanvas() {
  const modelUrl      = useBuilderStore((s) => s.modelUrl);
  const transformMode = useBuilderStore((s) => s.transformMode);
  const scale         = useBuilderStore((s) => s.scale);
  const animation     = useBuilderStore((s) => s.animation);

  return (
    <Canvas
      camera={{ position: [0, 1.5, 4], fov: 50 }}
      shadows
      gl={{ preserveDrawingBuffer: true }}
      className="w-full h-full"
    >
      <color attach="background" args={["#0f0f1a"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-4, 3, -4]} intensity={0.6} color="#a78bfa" />
      <pointLight position={[4, 1, 4]} intensity={0.3} color="#60a5fa" />

      <Suspense fallback={<LoadingBox />}>
        {modelUrl
          ? <GLBModel url={modelUrl} mode={transformMode} scale={scale} animation={animation} />
          : <PlaceholderModel mode={transformMode} scale={scale} animation={animation} />
        }
        <Environment preset="city" />
      </Suspense>

      <Grid
        args={[20, 20]}
        cellSize={0.8}
        cellThickness={0.4}
        cellColor="#2d2d4e"
        sectionColor="#4a4a7a"
        sectionSize={4}
        fadeDistance={18}
        infiniteGrid
      />

      <OrbitControls makeDefault enableDamping dampingFactor={0.07} minDistance={1} maxDistance={20} />
    </Canvas>
  );
}
