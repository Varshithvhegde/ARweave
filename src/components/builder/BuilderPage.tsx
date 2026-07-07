"use client";
import dynamic from "next/dynamic";
import BuilderToolbar from "./BuilderToolbar";
import BuilderSidepanel from "./BuilderSidepanel";
import { Loader2 } from "lucide-react";

// Load 3D canvas client-side only (WebGL)
const SceneCanvas = dynamic(() => import("./SceneCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-slate-950">
      <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
    </div>
  ),
});

export default function BuilderPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <BuilderToolbar />
      <div className="flex flex-1 overflow-hidden">
        {/* 3D Viewport */}
        <div className="flex-1 relative">
          <SceneCanvas />
          {/* Viewport label */}
          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white/70 pointer-events-none font-mono">
            3D Viewport — orbit: drag · zoom: scroll
          </div>
        </div>

        {/* Right sidepanel */}
        <BuilderSidepanel />
      </div>
    </div>
  );
}
