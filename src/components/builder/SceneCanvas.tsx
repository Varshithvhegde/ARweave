"use client";
import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, TransformControls, useGLTF, Center, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useBuilderStore, type AnimationType } from "@/lib/builderStore";
import { sceneRef } from "@/lib/sceneRef";

// ── Marker plane ─────────────────────────────────────────────
function MarkerPlane({ url }: { url: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    new THREE.TextureLoader().load(url, (tex) => {
      if (!meshRef.current) return;
      (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
      (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
    });
  }, [url]);
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial transparent opacity={0.85} />
    </mesh>
  );
}

// ── GLB model content (no animation — animation only in AR viewer) ─
function ModelContent({ url, scale }: { url: string; scale: number }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    if (ref.current) ref.current.scale.setScalar(scale);
  }, [scale]);
  return (
    <group ref={ref}>
      <Center disableY>
        <primitive object={scene.clone()} />
      </Center>
    </group>
  );
}

// ── Placeholder box ───────────────────────────────────────────
function BoxContent({ scale }: { scale: number }) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    if (ref.current) ref.current.scale.setScalar(scale);
  }, [scale]);
  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
}

// ── The draggable wrapper ─────────────────────────────────────
// Key insight: TransformControls needs `object` prop pointing to the
// Three.js object. We mount TC only AFTER the group ref is ready.
function DraggableEntity({
  modelUrl, scale, mode, initialPosition,
}: {
  modelUrl: string | null;
  scale: number;
  mode: "translate" | "rotate" | "scale";
  initialPosition: { x: number; y: number; z: number };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [ready, setReady] = useState(false);

  // After mount, set initial position and mark ready so TC can attach
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
      sceneRef.group = groupRef.current;
      setReady(true);
      console.log("[SceneCanvas] group ready, initial pos:", initialPosition);
    }
    return () => { sceneRef.group = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Group always in scene */}
      <group ref={groupRef}>
        <Suspense fallback={null}>
          {modelUrl
            ? <ModelContent url={modelUrl} scale={scale} />
            : <BoxContent scale={scale} />
          }
        </Suspense>
      </group>

      {/* TC attaches to the group object only after ref is populated */}
      {ready && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={mode}
          onMouseUp={() => {
            if (!groupRef.current) return;
            const p = groupRef.current.position;
            console.log("[SceneCanvas] mouseUp position:", p.x, p.y, p.z);
          }}
        />
      )}
    </>
  );
}

// ── Loading spinner ───────────────────────────────────────────
function LoadingBox() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d; });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial color="#7c3aed" wireframe />
    </mesh>
  );
}

// ── Main canvas ───────────────────────────────────────────────
export default function SceneCanvas() {
  const modelUrl      = useBuilderStore((s) => s.modelUrl);
  const markerUrl     = useBuilderStore((s) => s.markerUrl);
  const transformMode = useBuilderStore((s) => s.transformMode);
  const scale         = useBuilderStore((s) => s.scale);
  const modelPosition = useBuilderStore((s) => s.modelPosition);

  return (
    <Canvas camera={{ position: [0, 3, 5], fov: 50 }} shadows gl={{ preserveDrawingBuffer: true }} className="w-full h-full">
      <color attach="background" args={["#0f0f1a"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-4, 3, -4]} intensity={0.5} color="#a78bfa" />

      {markerUrl && <MarkerPlane url={markerUrl} />}

      <Suspense fallback={<LoadingBox />}>
        <DraggableEntity
          modelUrl={modelUrl}
          scale={scale}
          mode={transformMode}
          initialPosition={modelPosition}
        />
      </Suspense>

      <Grid args={[20, 20]} cellSize={0.5} cellThickness={0.4} cellColor="#2d2d4e" sectionColor="#4a4a7a" sectionSize={2} fadeDistance={18} infiniteGrid />

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={1} maxDistance={20} />
    </Canvas>
  );
}
