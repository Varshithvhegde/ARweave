"use client";
import { useEffect, useRef, useState } from "react";
import { useBuilderStore } from "@/lib/builderStore";
import { Layers3, Loader2, AlertTriangle } from "lucide-react";

// AR.js + A-Frame must be loaded dynamically — they attach to window
const AFRAME_URL = "https://aframe.io/releases/1.5.0/aframe.min.js";
const ARJS_URL   = "https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

type Status = "loading-scripts" | "ready" | "error" | "no-config";

export default function ARViewer({ slug }: { slug: string }) {
  const { modelUrl, markerUrl, scale, animation } = useBuilderStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading-scripts");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!modelUrl) { setStatus("no-config"); return; }

    let cancelled = false;

    async function bootstrap() {
      try {
        // Load A-Frame first, then AR.js (order matters)
        await loadScript(AFRAME_URL);
        await loadScript(ARJS_URL);
        if (cancelled) return;
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Failed to load AR libraries");
        setStatus("error");
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [modelUrl]);

  useEffect(() => {
    if (status !== "ready" || !containerRef.current || !modelUrl) return;

    // Clear any previous scene
    containerRef.current.innerHTML = "";

    const animAttr = animation === "spin"
      ? `property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear`
      : animation === "float"
      ? `property: position; from: 0 0 0; to: 0 0.15 0; dir: alternate; loop: true; dur: 1500; easing: easeInOutSine`
      : animation === "pulse"
      ? `property: scale; from: ${scale} ${scale} ${scale}; to: ${scale * 1.12} ${scale * 1.12} ${scale * 1.12}; dir: alternate; loop: true; dur: 800; easing: easeInOutSine`
      : "";

    const sceneHTML = markerUrl
      ? /* Image tracking (NFT) */ `
        <a-scene
          embedded
          arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
          vr-mode-ui="enabled: false"
          renderer="logarithmicDepthBuffer: true; precision: medium;"
          style="width:100vw;height:100vh;position:fixed;top:0;left:0;"
        >
          <a-nft
            type="nft"
            url="${markerUrl}"
            smooth="true"
            smoothCount="10"
            smoothTolerance="0.01"
            smoothThreshold="5"
          >
            <a-entity
              gltf-model="${modelUrl}"
              scale="${scale} ${scale} ${scale}"
              position="0 0 0"
              rotation="-90 0 0"
              ${animAttr ? `animation="${animAttr}"` : ""}
            ></a-entity>
          </a-nft>
          <a-entity camera></a-entity>
        </a-scene>
      `
      : /* Markerless — place on flat surface */ `
        <a-scene
          embedded
          arjs="sourceType: webcam; debugUIEnabled: false; patternRatio: 0.75"
          vr-mode-ui="enabled: false"
          renderer="logarithmicDepthBuffer: true; precision: medium;"
          style="width:100vw;height:100vh;position:fixed;top:0;left:0;"
        >
          <a-marker preset="hiro">
            <a-entity
              gltf-model="${modelUrl}"
              scale="${scale} ${scale} ${scale}"
              position="0 0 0"
              ${animAttr ? `animation="${animAttr}"` : ""}
            ></a-entity>
          </a-marker>
          <a-entity camera></a-entity>
        </a-scene>
      `;

    containerRef.current.innerHTML = sceneHTML;
  }, [status, modelUrl, markerUrl, scale, animation]);

  // ── No config (opened fresh, no store data) ──
  if (status === "no-config") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-2xl brand-gradient mx-auto flex items-center justify-center">
            <Layers3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold">AR experience not found</h1>
          <p className="text-sm text-white/60">
            This experience may not exist yet or was opened without a 3D model configured.
          </p>
          <a href="/dashboard" className="inline-block mt-2 text-sm underline text-violet-400">
            Go to dashboard
          </a>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h1 className="text-lg font-bold">Failed to load AR</h1>
          <p className="text-sm text-white/60">{errorMsg}</p>
          <button onClick={() => window.location.reload()} className="text-sm underline text-violet-400">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Loading scripts ──
  if (status === "loading-scripts") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-violet-400 mx-auto" />
          <p className="text-sm text-white/60">Loading AR engine…</p>
          <p className="text-xs text-white/30">First load may take a few seconds</p>
        </div>
      </div>
    );
  }

  // ── AR scene ready ──
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#000" }}>
      {/* AR scene is injected here by the useEffect */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* HUD overlay */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, pointerEvents: "none" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Layers3 style={{ width: 14, height: 14, color: "white" }} />
            </div>
            <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>ARweave</span>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            borderRadius: 20,
            padding: "4px 12px",
            color: "white",
            fontSize: 11,
          }}>
            {markerUrl ? "Point at your marker image" : "Point at a Hiro marker"}
          </div>
        </div>
      </div>
    </div>
  );
}
