"use client";
import { useEffect, useRef, useState } from "react";
import { Layers3, Loader2, AlertTriangle } from "lucide-react";

const AFRAME_URL = "https://aframe.io/releases/1.5.0/aframe.min.js";
const ARJS_URL   = "https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

type Config = {
  slug: string;
  name: string;
  modelUrl: string;
  markerUrl: string | null;
  scale: number;
  animation: string;
};

type Status = "fetching" | "loading-ar" | "ready" | "not-found" | "error";

export default function ARViewer({ slug }: { slug: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus]   = useState<Status>("fetching");
  const [config, setConfig]   = useState<Config | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1 — fetch config from API
  useEffect(() => {
    fetch(`/api/experience?slug=${encodeURIComponent(slug)}`)
      .then((r) => {
        if (r.status === 404) { setStatus("not-found"); return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setConfig(data);
        setStatus("loading-ar");
      })
      .catch((e) => {
        setErrorMsg(e.message);
        setStatus("error");
      });
  }, [slug]);

  // Step 2 — load AR.js scripts once config is ready
  useEffect(() => {
    if (status !== "loading-ar") return;
    let cancelled = false;

    loadScript(AFRAME_URL)
      .then(() => loadScript(ARJS_URL))
      .then(() => { if (!cancelled) setStatus("ready"); })
      .catch((e) => { if (!cancelled) { setErrorMsg(e.message); setStatus("error"); } });

    return () => { cancelled = true; };
  }, [status]);

  // Step 3 — inject A-Frame scene once scripts are loaded
  useEffect(() => {
    if (status !== "ready" || !config || !containerRef.current) return;

    containerRef.current.innerHTML = "";

    const { modelUrl, markerUrl, scale, animation } = config;

    // Build A-Frame animation attribute
    const animAttr = animation === "spin"
      ? `property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear`
      : animation === "float"
      ? `property: position; from: 0 0.1 0; to: 0 0.3 0; dir: alternate; loop: true; dur: 1500; easing: easeInOutSine`
      : animation === "pulse"
      ? `property: scale; from: ${scale} ${scale} ${scale}; to: ${scale * 1.12} ${scale * 1.12} ${scale * 1.12}; dir: alternate; loop: true; dur: 900; easing: easeInOutSine`
      : "";

    const anim = animAttr ? `animation="${animAttr}"` : "";
    const sc   = `${scale} ${scale} ${scale}`;

    let sceneHTML: string;

    if (markerUrl) {
      // NFT image tracking — detects the custom marker image
      sceneHTML = `
        <a-scene
          embedded
          arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
          vr-mode-ui="enabled: false"
          renderer="logarithmicDepthBuffer: true; precision: medium; antialias: true;"
          style="width:100vw;height:100dvh;position:fixed;top:0;left:0;"
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
              scale="${sc}"
              position="0 0 0"
              rotation="-90 0 0"
              ${anim}
            ></a-entity>
          </a-nft>
          <a-entity camera></a-entity>
        </a-scene>`;
    } else {
      // Hiro marker — standard printed pattern
      sceneHTML = `
        <a-scene
          embedded
          arjs="sourceType: webcam; debugUIEnabled: false; patternRatio: 0.75;"
          vr-mode-ui="enabled: false"
          renderer="logarithmicDepthBuffer: true; precision: medium; antialias: true;"
          style="width:100vw;height:100dvh;position:fixed;top:0;left:0;"
        >
          <a-marker preset="hiro">
            <a-entity
              gltf-model="${modelUrl}"
              scale="${sc}"
              position="0 0 0"
              ${anim}
            ></a-entity>
          </a-marker>
          <a-entity camera></a-entity>
        </a-scene>`;
    }

    containerRef.current.innerHTML = sceneHTML;
  }, [status, config]);

  // ── Screens ──

  if (status === "not-found") {
    return (
      <Screen icon={<AlertTriangle className="w-8 h-8 text-amber-400" />} title="Experience not found">
        <p className="text-sm text-white/60 text-center">
          This AR experience hasn&apos;t been published yet.<br />Go back to the builder and hit Publish.
        </p>
        <a href="/dashboard" className="text-sm text-violet-400 underline">Open builder</a>
      </Screen>
    );
  }

  if (status === "error") {
    return (
      <Screen icon={<AlertTriangle className="w-8 h-8 text-red-400" />} title="Something went wrong">
        <p className="text-sm text-white/60">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-violet-400 underline">Retry</button>
      </Screen>
    );
  }

  if (status === "fetching") {
    return (
      <Screen icon={<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />} title="Loading experience…" />
    );
  }

  if (status === "loading-ar") {
    return (
      <Screen icon={<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />} title="Loading AR engine…">
        <p className="text-xs text-white/40">First load may take a few seconds</p>
      </Screen>
    );
  }

  // Ready — render AR scene
  return (
    <div style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#000", position: "fixed", inset: 0 }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* HUD */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, pointerEvents: "none" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(124,58,237,0.4)",
            }}>
              <Layers3 style={{ width: 15, height: 15, color: "white" }} />
            </div>
            <div>
              <p style={{ color: "white", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>ARweave</p>
              {config?.name && (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 2 }}>{config.name}</p>
              )}
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: 20,
            padding: "5px 12px",
            color: "rgba(255,255,255,0.9)",
            fontSize: 11,
            fontWeight: 500,
          }}>
            {config?.markerUrl ? "Point at your marker image" : "Point at Hiro marker"}
          </div>
        </div>
      </div>
    </div>
  );
}

function Screen({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080810" }}>
      <div style={{ textAlign: "center", padding: "0 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        {icon}
        <h1 style={{ color: "white", fontSize: 18, fontWeight: 700 }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}
