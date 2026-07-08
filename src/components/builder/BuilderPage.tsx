"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import BuilderToolbar from "./BuilderToolbar";
import BuilderSidepanel from "./BuilderSidepanel";
import { useBuilderStore } from "@/lib/builderStore";
import { Loader2 } from "lucide-react";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0f0f1a]">
      <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
    </div>
  ),
});

export default function BuilderPage({ slug }: { slug: string }) {
  const {
    setProjectName, setPublished, setModelFromUrl,
    setActivePanel, setMarkerMindUrl, setMarkerImageUrl, setScale, setAnimation, setModelPosition,
    setOverlayFromUrl, setOverlayDimensions, setOverlayPosition,
  } = useBuilderStore();

  // Don't render canvas until API data is loaded — ensures DraggableEntity
  // mounts with the correct initial position, not {0,0,0}
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!slug || slug === "new") {
      setDataLoaded(true);
      return;
    }

    fetch(`/api/experience?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setProjectName(data.name || slug);
          if (data.modelUrl)       setModelFromUrl(data.modelUrl, data.name || slug);
          if (data.markerUrl)      setMarkerMindUrl(data.markerUrl);
          if (data.markerImageUrl) setMarkerImageUrl(data.markerImageUrl);
          if (data.scale)          setScale(Number(data.scale));
          if (data.animation)      setAnimation(data.animation);
          if (data.position)       setModelPosition(data.position);
          if (data.overlay?.url) {
            setOverlayFromUrl(data.overlay.url, data.overlay.type);
            setOverlayDimensions(data.overlay.width ?? 1, data.overlay.height ?? 0.75);
            if (data.overlay.position) setOverlayPosition(data.overlay.position);
          }
          if (data.status === "published" || data.modelUrl) {
            setPublished(slug);
            setActivePanel("settings");
          }
        }
      })
      .catch(() => {})
      .finally(() => setDataLoaded(true));
  }, [slug, setProjectName, setModelFromUrl, setPublished, setActivePanel, setMarkerMindUrl, setMarkerImageUrl, setScale, setAnimation, setModelPosition, setOverlayFromUrl, setOverlayDimensions, setOverlayPosition]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f0f1a]">
      <BuilderToolbar slug={slug} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          {dataLoaded
            ? <SceneCanvas />
            : (
              <div className="flex-1 h-full flex items-center justify-center bg-[#0f0f1a]">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            )
          }
          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white/60 pointer-events-none font-mono">
            orbit: drag · zoom: scroll · {slug}
          </div>
        </div>
        <BuilderSidepanel slug={slug} />
      </div>
    </div>
  );
}
