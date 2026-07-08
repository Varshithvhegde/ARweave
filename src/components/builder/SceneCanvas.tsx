"use client";
import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, TransformControls, useGLTF, Center, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useBuilderStore } from "@/lib/builderStore";
import { sceneRef } from "@/lib/sceneRef";

// ── Marker reference plane (visual guide, NOT in rootGroup) ───
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
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial transparent opacity={0.7} />
    </mesh>
  );
}

// ── GLB model content ─────────────────────────────────────────
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

// ── Model mesh (no TC — TC is rendered OUTSIDE rootGroup) ─────
function ModelMesh({
  modelUrl, scale, initialPosition, onGroupReady,
}: {
  modelUrl: string | null;
  scale: number;
  initialPosition: { x: number; y: number; z: number };
  onGroupReady: (g: THREE.Group) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const notified = useRef(false);

  useEffect(() => {
    if (groupRef.current && !notified.current) {
      groupRef.current.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
      sceneRef.group = groupRef.current;
      onGroupReady(groupRef.current);
      notified.current = true;
    }
    return () => { sceneRef.group = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
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
  );
}

// ── Overlay image plane mesh (no TC) ──────────────────────────
function OverlayMesh({
  url, width, height, initialPosition, onGroupReady,
}: {
  url: string;
  width: number;
  height: number;
  initialPosition: { x: number; y: number; z: number };
  onGroupReady: (g: THREE.Group) => void;
}) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const notified = useRef(false);

  useEffect(() => {
    new THREE.TextureLoader().load(url, (tex) => {
      if (!meshRef.current) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      (meshRef.current.material as THREE.MeshBasicMaterial).map = tex;
      (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    });
  }, [url]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = new THREE.PlaneGeometry(width, height);
    }
  }, [width, height]);

  useEffect(() => {
    if (groupRef.current && !notified.current) {
      groupRef.current.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
      sceneRef.overlayGroup = groupRef.current;
      onGroupReady(groupRef.current);
      notified.current = true;
    }
    return () => { sceneRef.overlayGroup = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group ref={groupRef} name="overlay">
      {/* Flat on XZ plane, facing up */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Root group — only content objects, NO helpers ─────────────
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

  // TC target objects — set when mesh groups are ready
  const [modelGroup,   setModelGroup]   = useState<THREE.Group | null>(null);
  const [overlayGroup, setOverlayGroup] = useState<THREE.Group | null>(null);

  // Which TC is active
  const tcTarget = activePanel === "overlay" ? overlayGroup : modelGroup;

  return (
    <Canvas camera={{ position: [0, 3, 5], fov: 50 }} shadows gl={{ preserveDrawingBuffer: true }} className="w-full h-full">
      <color attach="background" args={["#0f0f1a"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-4, 3, -4]} intensity={0.5} color="#a78bfa" />

      {/* Marker guide — OUTSIDE rootGroup, never exported */}
      {markerUrl && <MarkerPlane url={markerUrl} />}

      {/* ── ROOT GROUP — only objects that get baked into GLB ── */}
      <RootGroup>
        <Suspense fallback={<LoadingBox />}>
          <ModelMesh
            modelUrl={modelUrl}
            scale={scale}
            initialPosition={modelPosition}
            onGroupReady={setModelGroup}
          />
        </Suspense>

        {overlayUrl && overlayType === "image" && (
          <OverlayMesh
            url={overlayUrl}
            width={overlayWidth}
            height={overlayHeight}
            initialPosition={overlayPosition}
            onGroupReady={setOverlayGroup}
          />
        )}
      </RootGroup>

      {/* ── TransformControls — OUTSIDE rootGroup, NEVER exported ── */}
      {tcTarget && (
        <TransformControls
          object={tcTarget}
          mode={transformMode}
        />
      )}

      <Grid args={[20, 20]} cellSize={0.5} cellThickness={0.4} cellColor="#2d2d4e" sectionColor="#4a4a7a" sectionSize={2} fadeDistance={18} infiniteGrid />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={1} maxDistance={20} />
    </Canvas>
  );
}
