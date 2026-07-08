"use client";
import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, TransformControls, useGLTF, Center, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useBuilderStore } from "@/lib/builderStore";
import { sceneRef } from "@/lib/sceneRef";

// ── Marker reference plane (not exported — just visual guide) ─
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
      <meshStandardMaterial transparent opacity={0.7} />
    </mesh>
  );
}

// ── GLB model ─────────────────────────────────────────────────
function ModelContent({ url, scale }: { url: string; scale: number }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    if (ref.current) ref.current.scale.setScalar(scale);
  }, [scale]);
  return (
    <group ref={ref}>
      <Center disableY><primitive object={scene.clone()} /></Center>
    </group>
  );
}

// ── Draggable 3D model with TC ────────────────────────────────
function DraggableModel({
  modelUrl, scale, mode, initialPosition, isActive,
}: {
  modelUrl: string | null;
  scale: number;
  mode: "translate" | "rotate" | "scale";
  initialPosition: { x: number; y: number; z: number };
  isActive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
      sceneRef.group = groupRef.current;
      setReady(true);
    }
    return () => { sceneRef.group = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <group ref={groupRef} name="model">
        <Suspense fallback={null}>
          {modelUrl
            ? <ModelContent url={modelUrl} scale={scale} />
            : (
              <mesh castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#7c3aed" roughness={0.3} metalness={0.2} />
              </mesh>
            )
          }
        </Suspense>
      </group>
      {ready && groupRef.current && isActive && (
        <TransformControls object={groupRef.current} mode={mode} />
      )}
    </>
  );
}

// ── Draggable overlay image plane with TC ─────────────────────
function OverlayPlane({
  url, width, height, mode, initialPosition, isActive,
}: {
  url: string;
  width: number;
  height: number;
  mode: "translate" | "rotate" | "scale";
  initialPosition: { x: number; y: number; z: number };
  isActive: boolean;
}) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    new THREE.TextureLoader().load(url, (tex) => {
      if (!meshRef.current) return;
      (meshRef.current.material as THREE.MeshBasicMaterial).map = tex;
      (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    });
  }, [url]);

  // Update plane size when dimensions change
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = new THREE.PlaneGeometry(width, height);
    }
  }, [width, height]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
      sceneRef.overlayGroup = groupRef.current;
      setReady(true);
    }
    return () => { sceneRef.overlayGroup = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <group ref={groupRef} name="overlay">
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial transparent side={THREE.DoubleSide} />
        </mesh>
      </group>
      {ready && groupRef.current && isActive && (
        <TransformControls object={groupRef.current} mode={mode} />
      )}
    </>
  );
}

// ── Root group — registers itself for GLB export ──────────────
function RootGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    sceneRef.rootGroup = ref.current;
    return () => { sceneRef.rootGroup = null; };
  }, []);
  return <group ref={ref} name="arweave-scene">{children}</group>;
}

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
  const modelUrl        = useBuilderStore((s) => s.modelUrl);
  const markerUrl       = useBuilderStore((s) => s.markerUrl);
  const transformMode   = useBuilderStore((s) => s.transformMode);
  const scale           = useBuilderStore((s) => s.scale);
  const modelPosition   = useBuilderStore((s) => s.modelPosition);
  const overlayUrl      = useBuilderStore((s) => s.overlayUrl);
  const overlayType     = useBuilderStore((s) => s.overlayType);
  const overlayWidth    = useBuilderStore((s) => s.overlayWidth);
  const overlayHeight   = useBuilderStore((s) => s.overlayHeight);
  const overlayPosition = useBuilderStore((s) => s.overlayPosition);
  const activePanel     = useBuilderStore((s) => s.activePanel);

  const modelActive   = activePanel !== "overlay";
  const overlayActive = activePanel === "overlay";

  return (
    <Canvas camera={{ position: [0, 3, 5], fov: 50 }} shadows gl={{ preserveDrawingBuffer: true }} className="w-full h-full">
      <color attach="background" args={["#0f0f1a"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-4, 3, -4]} intensity={0.5} color="#a78bfa" />

      {/* Marker plane — visual guide only, NOT included in root group */}
      {markerUrl && <MarkerPlane url={markerUrl} />}

      {/* Root group — EVERYTHING inside here gets baked into the final GLB */}
      <RootGroup>
        <Suspense fallback={<LoadingBox />}>
          <DraggableModel
            modelUrl={modelUrl}
            scale={scale}
            mode={transformMode}
            initialPosition={modelPosition}
            isActive={modelActive}
          />
        </Suspense>

        {overlayUrl && overlayType === "image" && (
          <OverlayPlane
            url={overlayUrl}
            width={overlayWidth}
            height={overlayHeight}
            mode={transformMode}
            initialPosition={overlayPosition}
            isActive={overlayActive}
          />
        )}
      </RootGroup>

      <Grid args={[20, 20]} cellSize={0.5} cellThickness={0.4} cellColor="#2d2d4e" sectionColor="#4a4a7a" sectionSize={2} fadeDistance={18} infiniteGrid />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={1} maxDistance={20} />
    </Canvas>
  );
}
