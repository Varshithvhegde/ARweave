"use client";
import { useState } from "react";
import { Move, RotateCcw, Maximize2, ArrowLeft, Eye, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBuilderStore, type TransformMode } from "@/lib/builderStore";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MODES: { mode: TransformMode; icon: React.FC<{ className?: string }>; label: string }[] = [
  { mode: "translate", icon: Move,      label: "Move" },
  { mode: "rotate",    icon: RotateCcw, label: "Rotate" },
  { mode: "scale",     icon: Maximize2, label: "Scale" },
];

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
    modelUrl, modelFile,
    markerUrl, markerFile,
    scale, animation,
    baseUrl,
  } = useBuilderStore();

  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!modelUrl) { toast.error("Add a 3D model first"); return; }
    setPublishing(true);

    // The base that the phone will use to fetch assets
    const origin = baseUrl.trim() || window.location.origin;

    try {
      // Upload model file if it was a local upload (has a File object)
      let finalModelUrl = modelUrl;
      if (modelFile) {
        toast.loading("Uploading model…", { id: "publish" });
        const path = await uploadFile(modelFile, "model");
        // Make absolute so the phone can fetch it via ngrok
        finalModelUrl = path.startsWith("http") ? path : `${origin}${path}`;
      }

      // Upload marker if it was a local file
      let finalMarkerUrl: string | null = markerUrl;
      if (markerFile) {
        toast.loading("Uploading marker…", { id: "publish" });
        const path = await uploadFile(markerFile, "marker");
        finalMarkerUrl = path.startsWith("http") ? path : `${origin}${path}`;
      }

      // Use the route slug (already created in DB) — not derived from project name
      toast.loading("Publishing…", { id: "publish" });

      // Get current user id if logged in
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch("/api/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name:      projectName,
          modelUrl:  finalModelUrl,
          markerUrl: finalMarkerUrl,
          scale,
          animation,
          userId:    user?.id ?? null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save experience");

      setPublished(slug);
      setActivePanel("settings");
      toast.success("Published!", {
        id: "publish",
        description: "Scan the QR on your phone to test AR",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed", { id: "publish" });
    } finally {
      setPublishing(false);
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
          disabled={publishing || !modelUrl}
          className="brand-gradient text-white border-0 hover:opacity-90 gap-1.5 h-8 text-xs font-semibold disabled:opacity-50"
        >
          {publishing
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing…</>
            : <><Globe className="w-3.5 h-3.5" />{isPublished ? "Update" : "Publish"}</>
          }
        </Button>
      </div>
    </div>
  );
}
