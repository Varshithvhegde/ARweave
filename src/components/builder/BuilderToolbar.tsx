"use client";
import { Move, RotateCcw, Maximize2, ArrowLeft, Eye, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBuilderStore, type TransformMode } from "@/lib/builderStore";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MODES: { mode: TransformMode; icon: React.FC<{ className?: string }>; label: string }[] = [
  { mode: "translate", icon: Move,       label: "Move" },
  { mode: "rotate",    icon: RotateCcw,  label: "Rotate" },
  { mode: "scale",     icon: Maximize2,  label: "Scale" },
];

export default function BuilderToolbar() {
  const {
    transformMode, setTransformMode,
    projectName, setProjectName,
    isPublished, setPublished, publishedSlug,
    setActivePanel,
  } = useBuilderStore();

  const handlePublish = () => {
    const slug = projectName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 40) || "my-experience";
    setPublished(slug);
    setActivePanel("settings");
    toast.success("Published!", {
      description: `AR viewer ready — check the Share tab for your QR code.`,
    });
  };

  const previewUrl = publishedSlug ? `/ar/${publishedSlug}` : null;

  return (
    <div className="h-14 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
      {/* Back */}
      <Link href="/dashboard">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </Link>

      <Separator orientation="vertical" className="h-5" />

      {/* Project name */}
      <input
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="text-sm font-semibold bg-transparent border-none outline-none hover:bg-muted focus:bg-muted px-2 py-1 rounded-md w-40 truncate transition-colors"
        aria-label="Project name"
      />

      <Separator orientation="vertical" className="h-5" />

      {/* Transform mode toggle */}
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
        {/* Preview button — opens AR viewer in new tab */}
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
          className="brand-gradient text-white border-0 hover:opacity-90 gap-1.5 h-8 text-xs font-semibold"
        >
          <Globe className="w-3.5 h-3.5" />
          {isPublished ? "Update" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
