"use client";
import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, TransformControls, useGLTF, Center, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useBuilderStore, type AnimationType } from "@/lib/builderStore";

function useModelAnimation(ref: React.RefObject<THREE.Group | null>, animation: AnimationType) {
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (animation === "spin") ref.current.rotation.y += delta * 1.2;
    else if (animation === "float") ref.current.position.y = Math.sin(Date.now() * 0.001) * 0.15;
    else if (animation === "pulse") {
      const s = 1 + Math.sin(Date.now() * 0.002) * 0.08;
      ref.current.scale.setScalar(s);
    }
  });
}

function MarkerPlane({ url }: { url: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      if (meshRef.current) {
        (meshRef.current.material as THREE.MeshStandardMaterial).map = tex;
        (meshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
      }
    });
  }, [url]);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial transparent opacity={0.85} />
    </mesh>
  );
}

function ModelContent({ url, scale, animation }: { url: string; scale: number; animation: AnimationType }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);
  useModelAnimation(ref, animation);
  useEffect(() => {
    if (ref.current && animation !== "pulse") ref.current.scale.setScalar(scale);
  }, [scale, animation]);
  return (
    <group ref={ref}>
      <Center disableY>
        <primitive object={scene.clone()} />
      </Center>
    </group>
  );
}

function BoxContent({ scale, animation }: { scale: number; animation: AnimationType }) {
  const ref = useRef<THREE.Group>(null);
  useModelAnimation(ref, animation);
  useEffect(() => {
    if (ref.current && animation !== "pulse") ref.current.scale.setScalar(scale);
  }, [scale, animation]);
  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
}

function DraggableEntity({
  modelUrl, scale, animation, mode, initialPosition, onMove,
}: {
  modelUrl: string | null;
  scale: number;
  animation: AnimationType;
  mode: "translate" | "rotate" | "scale";
  initialPosition: { x: number; y: number; z: number };
  onMove: (p: { x: number; y: number; z: number }) => void;
}) {
  const groupRef   = useRef<THREE.Group>(null);
  const onMoveRef  = useRef(onMove);
  onMoveRef.current = onMove; // always current without re-adding listeners

  // Set initial position on mount
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every frame: read actual position from Three.js object and sync to store
  // This is the only reliable way — TC updates the matrix, not React state
  useFrame(() => {
    if (!groupRef.current) return;
    const p = groupRef.current.position;
    // Round to 4dp to avoid floating point noise updates
    const x = parseFloat(p.x.toFixed(4));
    const y = parseFloat(p.y.toFixed(4));
    const z = parseFloat(p.z.toFixed(4));
    onMoveRef.current({ x, y, z });
  });

  return (
    <TransformControls mode={mode}>
      <group ref={groupRef}>
        <Suspense fallback={null}>
          {modelUrl
            ? <ModelContent url={modelUrl} scale={scale} animation={animation} />
            : <BoxContent scale={scale} animation={animation} />
          }
        </Suspense>
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

export default function SceneCanvas() {
  const modelUrl      = useBuilderStore((s) => s.modelUrl);
  const markerUrl     = useBuilderStore((s) => s.markerUrl);
  const transformMode = useBuilderStore((s) => s.transformMode);
  const scale         = useBuilderStore((s) => s.scale);
  const animation     = useBuilderStore((s) => s.animation);
  const modelPosition = useBuilderStore((s) => s.modelPosition);
  const setModelPosition = useBuilderStore((s) => s.setModelPosition);

  return (
    <Canvas
      camera={{ position: [0, 3, 5], fov: 50 }}
      shadows
      gl={{ preserveDrawingBuffer: true }}
      className="w-full h-full"
    >
      <color attach="background" args={["#0f0f1a"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-4, 3, -4]} intensity={0.5} color="#a78bfa" />

      {markerUrl && <MarkerPlane url={markerUrl} />}

      <Suspense fallback={<LoadingBox />}>
        <DraggableEntity
          modelUrl={modelUrl}
          scale={scale}
          animation={animation}
          mode={transformMode}
          initialPosition={modelPosition}
          onMove={setModelPosition}
        />
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

      {/* makeDefault lets TransformControls disable orbit when dragging */}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={1} maxDistance={20} />
    </Canvas>
  );
}
