"use client";
import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, TransformControls, useGLTF, Center, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useBuilderStore, type AnimationType } from "@/lib/builderStore";

function useModelAnimation(ref: React.RefObject<THREE.Group | null>, animation: AnimationType) {
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (animation === "spin")  ref.current.rotation.y += delta * 1.2;
    else if (animation === "float") ref.current.position.y = Math.sin(Date.now() * 0.001) * 0.15;
    else if (animation === "pulse") {
      const s = 1 + Math.sin(Date.now() * 0.002) * 0.08;
      ref.current.scale.setScalar(s);
    }
  });
}

// Marker plane — shows the uploaded marker image flat on the ground
function MarkerPlane({ url }: { url: string }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(url, (t) => setTex(t));
  }, [url]);

  if (!tex) return null;

  // Marker is 2×2 units, flat on XZ plane
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial map={tex} transparent opacity={0.85} />
    </mesh>
  );
}

// The draggable model
function DraggableModel({
  url, scale, animation, mode, position, onMove,
}: {
  url: string;
  scale: number;
  animation: AnimationType;
  mode: "translate" | "rotate" | "scale";
  position: { x: number; y: number; z: number };
  onMove: (pos: { x: number; y: number; z: number }) => void;
}) {
  const { scene } = useGLTF(url);
  const groupRef  = useRef<THREE.Group>(null);
  const tcRef     = useRef<any>(null);

  useModelAnimation(groupRef, animation);

  // Sync initial position from store
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position.x, position.y, position.z);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Apply scale (not during pulse animation)
  useEffect(() => {
    if (groupRef.current && animation !== "pulse") {
      groupRef.current.scale.setScalar(scale);
    }
  }, [scale, animation]);

  // Save position when user finishes dragging
  const handleChange = () => {
    if (!groupRef.current) return;
    const p = groupRef.current.position;
    onMove({ x: parseFloat(p.x.toFixed(3)), y: parseFloat(p.y.toFixed(3)), z: parseFloat(p.z.toFixed(3)) });
  };

  return (
    <TransformControls
      ref={tcRef}
      object={groupRef.current ?? undefined}
      mode={mode}
      onMouseUp={handleChange}
    >
      <group ref={groupRef}>
        <Center disableY>
          <primitive object={scene.clone()} />
        </Center>
      </group>
    </TransformControls>
  );
}

function PlaceholderBox({
  scale, animation, mode, position, onMove,
}: {
  scale: number;
  animation: AnimationType;
  mode: "translate" | "rotate" | "scale";
  position: { x: number; y: number; z: number };
  onMove: (pos: { x: number; y: number; z: number }) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useModelAnimation(groupRef, animation);

  useEffect(() => {
    if (groupRef.current && animation !== "pulse") groupRef.current.scale.setScalar(scale);
  }, [scale, animation]);

  const handleChange = () => {
    if (!groupRef.current) return;
    const p = groupRef.current.position;
    onMove({ x: parseFloat(p.x.toFixed(3)), y: parseFloat(p.y.toFixed(3)), z: parseFloat(p.z.toFixed(3)) });
  };

  return (
    <TransformControls object={groupRef.current ?? undefined} mode={mode} onMouseUp={handleChange}>
      <group ref={groupRef} position={[position.x, position.y, position.z]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#7c3aed" roughness={0.3} metalness={0.2} />
        </mesh>
      </group>
    </TransformControls>
  );
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

// Disable OrbitControls while TransformControls is being used
function OrbitToggle({ tcActive }: { tcActive: boolean }) {
  const orbitRef = useRef<any>(null);
  useEffect(() => {
    if (orbitRef.current) orbitRef.current.enabled = !tcActive;
  }, [tcActive]);
  return (
    <OrbitControls
      ref={orbitRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1}
      maxDistance={20}
    />
  );
}

export default function SceneCanvas() {
  const modelUrl      = useBuilderStore((s) => s.modelUrl);
  const markerUrl     = useBuilderStore((s) => s.markerUrl);
  const transformMode = useBuilderStore((s) => s.transformMode);
  const scale         = useBuilderStore((s) => s.scale);
  const animation     = useBuilderStore((s) => s.animation);
  const modelPosition = useBuilderStore((s) => s.modelPosition);
  const setModelPosition = useBuilderStore((s) => s.setModelPosition);

  const [tcActive, setTcActive] = useState(false);

  return (
    <Canvas
      camera={{ position: [0, 3, 5], fov: 50 }}
      shadows
      gl={{ preserveDrawingBuffer: true }}
      className="w-full h-full"
      onPointerDown={() => setTcActive(true)}
      onPointerUp={() => setTcActive(false)}
    >
      <color attach="background" args={["#0f0f1a"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-4, 3, -4]} intensity={0.5} color="#a78bfa" />

      {/* Show marker image as a flat plane when uploaded */}
      {markerUrl && <MarkerPlane url={markerUrl} />}

      <Suspense fallback={<LoadingBox />}>
        {modelUrl ? (
          <DraggableModel
            url={modelUrl}
            scale={scale}
            animation={animation}
            mode={transformMode}
            position={modelPosition}
            onMove={setModelPosition}
          />
        ) : (
          <PlaceholderBox
            scale={scale}
            animation={animation}
            mode={transformMode}
            position={modelPosition}
            onMove={setModelPosition}
          />
        )}
      </Suspense>

      <Grid
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.4}
        cellColor="#2d2d4e"
        sectionColor="#4a4a7a"
        sectionSize={2}
        fadeDistance={18}
        infiniteGrid
      />

      <OrbitToggle tcActive={tcActive} />
    </Canvas>
  );
}
