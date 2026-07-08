"use client";
import { useState } from "react";
import { Move, RotateCcw, Maximize2, ArrowLeft, Eye, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBuilderStore, type TransformMode } from "@/lib/builderStore";
import { createClient } from "@/lib/supabase/client";
import { sceneRef } from "@/lib/sceneRef";
import { exportSceneToGLB } from "@/lib/sceneExporter";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MODES: { mode: TransformMode; icon: React.FC<{ className?: string }>; label: string }[] = [
  { mode: "translate", icon: Move,      label: "Move" },
  { mode: "rotate",    icon: RotateCcw, label: "Rotate" },
  { mode: "scale",     icon: Maximize2, label: "Scale" },
];

async function uploadBuffer(buffer: ArrayBuffer, filename: string, contentType: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", new File([buffer], filename, { type: contentType }));
  fd.append("type", "model");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const { url } = await res.json();
  return url;
}

async function uploadFile(file: File, type: "model" | "marker"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const { url } = await res.json();
  return url;
}

export default function BuilderToolbar({ slug }: { slug: string }) {
  const {
    transformMode, setTransformMode,
    projectName, setProjectName,
    isPublished, setPublished, publishedSlug,
    setActivePanel,
    markerFile, markerMindUrl, markerImageUrl,
    animation, baseUrl,
  } = useBuilderStore();

  const [publishing, setPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState("");

  const handlePublish = async () => {
    if (!sceneRef.rootGroup) { toast.error("Scene not ready yet"); return; }
    setPublishing(true);
    const origin = baseUrl.trim() || window.location.origin;

    try {
      // ── Step 1: Bake the entire scene to a single GLB ──────────────
      setPublishStep("Baking scene to GLB…");
      toast.loading("Baking scene to GLB…", { id: "publish" });

      const glbBuffer = await exportSceneToGLB(sceneRef.rootGroup);

      // ── Step 2: Upload baked GLB ───────────────────────────────────
      setPublishStep("Uploading baked model…");
      toast.loading("Uploading baked model…", { id: "publish" });

      const bakedModelUrl = await uploadBuffer(
        glbBuffer,
        `baked_${slug}_${Date.now()}.glb`,
        "model/gltf-binary"
      );
      const finalModelUrl = bakedModelUrl.startsWith("http") ? bakedModelUrl : `${origin}${bakedModelUrl}`;

      // ── Step 3: Upload marker if needed ────────────────────────────
      let finalMarkerUrl: string | null = markerMindUrl ?? null;
      if (!finalMarkerUrl && markerFile) {
        setPublishStep("Uploading marker…");
        toast.loading("Uploading marker…", { id: "publish" });
        const path = await uploadFile(markerFile, "marker");
        finalMarkerUrl = path.startsWith("http") ? path : `${origin}${path}`;
      }

      // ── Step 4: Save to DB ─────────────────────────────────────────
      setPublishStep("Saving…");
      toast.loading("Saving…", { id: "publish" });

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch("/api/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name:           projectName,
          modelUrl:       finalModelUrl,  // this is now the BAKED GLB
          markerUrl:      finalMarkerUrl,
          markerImageUrl: markerImageUrl ?? null,
          scale:          1,              // scale is baked in — always 1 in AR viewer
          animation,
          position:       { x: 0, y: 0, z: 0 }, // position is baked in — always 0 in AR viewer
          overlayType:    "none",         // overlay is baked in — no separate overlay in AR viewer
          overlayUrl:     null,
          overlayWidth:   1,
          overlayHeight:  0.75,
          overlayPosition: { x: 0, y: 0, z: 0 },
          userId:         user?.id ?? null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save experience");

      setPublished(slug);
      setActivePanel("settings");
      toast.success("Published!", {
        id: "publish",
        description: "Scene baked to single GLB · Scan the QR to test",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed", { id: "publish" });
    } finally {
      setPublishing(false);
      setPublishStep("");
    }
  };

  const previewUrl = publishedSlug ? `/ar/${publishedSlug}` : null;

  return (
    <div className="h-14 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
      <Link href="/dashboard">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </Link>

      <Separator orientation="vertical" className="h-5" />

      <input
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="text-sm font-semibold bg-transparent border-none outline-none hover:bg-muted focus:bg-muted px-2 py-1 rounded-md w-44 truncate transition-colors"
        aria-label="Project name"
      />

      <Separator orientation="vertical" className="h-5" />

      <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
        {MODES.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setTransformMode(mode)}
            title={label}
            aria-label={label}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              transformMode === mode
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {isPublished && previewUrl && (
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Eye className="w-3.5 h-3.5" /> Preview AR
            </Button>
          </a>
        )}

        <Button
          size="sm"
          onClick={handlePublish}
          disabled={publishing}
          className="brand-gradient text-white border-0 hover:opacity-90 gap-1.5 h-8 text-xs font-semibold disabled:opacity-50"
          title={publishing ? publishStep : ""}
        >
          {publishing
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{publishStep || "Publishing…"}</>
            : <><Globe className="w-3.5 h-3.5" />{isPublished ? "Update" : "Publish"}</>
          }
        </Button>
      </div>
    </div>
  );
}
