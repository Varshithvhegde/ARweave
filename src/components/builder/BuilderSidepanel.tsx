"use client";
import { useRef } from "react";
import { Upload, Box, Scan, Settings2, QrCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useBuilderStore, type AnimationType } from "@/lib/builderStore";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { QRCodeSVG as QRCode } from "qrcode.react";

const ANIMATIONS: { value: AnimationType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "spin", label: "Spin" },
  { value: "float", label: "Float" },
  { value: "pulse", label: "Pulse" },
];

const FREE_MODELS = [
  { name: "Cube", emoji: "🧊" },
  { name: "Star", emoji: "⭐" },
  { name: "Heart", emoji: "❤️" },
  { name: "Ring", emoji: "💍" },
  { name: "Trophy", emoji: "🏆" },
  { name: "Rocket", emoji: "🚀" },
];

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-2 text-xs font-semibold transition-colors",
        active ? "text-foreground border-b-2 border-[var(--brand)]" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default function BuilderSidepanel() {
  const { activePanel, setActivePanel, scale, setScale, animation, setAnimation, isPublished, publishedSlug, markerUrl, setMarkerUrl } = useBuilderStore();
  const markerInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = publishedSlug ? `https://${publishedSlug}.arweave.app` : null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const handleMarkerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMarkerUrl(url);
    toast.success("Marker image set!");
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success(`Model "${file.name}" loaded!`);
  };

  return (
    <aside className="w-64 border-l border-border bg-card flex flex-col shrink-0 overflow-y-auto">
      {/* Tabs */}
      <div className="flex border-b border-border px-1">
        <Tab active={activePanel === "model"} onClick={() => setActivePanel("model")}>
          <Box className="w-3.5 h-3.5 inline mr-1" />Model
        </Tab>
        <Tab active={activePanel === "marker"} onClick={() => setActivePanel("marker")}>
          <Scan className="w-3.5 h-3.5 inline mr-1" />Marker
        </Tab>
        <Tab active={activePanel === "settings"} onClick={() => setActivePanel("settings")}>
          <Settings2 className="w-3.5 h-3.5 inline mr-1" />Share
        </Tab>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* MODEL PANEL */}
        {activePanel === "model" && (
          <>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Upload GLB model
              </Label>
              <input ref={modelInputRef} type="file" accept=".glb,.gltf" className="hidden" onChange={handleModelUpload} />
              <button
                onClick={() => modelInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-[var(--brand)] hover:bg-[var(--brand-muted)] transition-colors group"
              >
                <Upload className="w-6 h-6 mx-auto text-muted-foreground group-hover:text-[var(--brand)] mb-2 transition-colors" />
                <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Drop GLB file here<br />or click to browse
                </p>
              </button>
            </div>

            <Separator />

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Free model library
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {FREE_MODELS.map((m) => (
                  <button
                    key={m.name}
                    className="aspect-square rounded-xl border border-border bg-muted hover:border-[var(--brand)] hover:bg-[var(--brand-muted)] transition-colors flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    title={m.name}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                  Scale: {scale.toFixed(1)}x
                </Label>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-[var(--brand)]"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                  Animation
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ANIMATIONS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAnimation(a.value)}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors",
                        animation === a.value
                          ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* MARKER PANEL */}
        {activePanel === "marker" && (
          <>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Marker image
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Upload any image — wedding photo, product, poster. The camera will detect this image and overlay your 3D model.
              </p>
              <input ref={markerInputRef} type="file" accept="image/*" className="hidden" onChange={handleMarkerUpload} />
              <button
                onClick={() => markerInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-[var(--brand)] hover:bg-[var(--brand-muted)] transition-colors group"
              >
                {markerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={markerUrl} alt="Marker" className="w-full h-32 object-cover rounded-lg" />
                ) : (
                  <>
                    <Scan className="w-6 h-6 mx-auto text-muted-foreground group-hover:text-[var(--brand)] mb-2 transition-colors" />
                    <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      Upload marker image<br />JPG, PNG, WebP
                    </p>
                  </>
                )}
              </button>
              {markerUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => markerInputRef.current?.click()}
                >
                  Change image
                </Button>
              )}
            </div>

            <Separator />

            <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground">Tips for best tracking:</p>
              <p>• Use high-contrast images with unique patterns</p>
              <p>• Avoid plain, low-detail images</p>
              <p>• Landscape orientation works best</p>
              <p>• Minimum 300×300px recommended</p>
            </div>
          </>
        )}

        {/* SETTINGS / SHARE PANEL */}
        {activePanel === "settings" && (
          <>
            {isPublished && shareUrl ? (
              <>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                    Share link
                  </Label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 text-xs bg-muted border border-border rounded-lg px-3 py-2 font-mono min-w-0"
                    />
                    <Button size="icon" variant="outline" className="shrink-0 h-9 w-9" onClick={handleCopy}>
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">
                    QR Code
                  </Label>
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-xl border border-border">
                      <QRCode value={shareUrl} size={140} level="M" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5"
                      onClick={() => toast.info("Download feature coming soon!")}
                    >
                      <QrCode className="w-3.5 h-3.5" /> Download QR
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Not published yet</p>
                <p className="text-xs text-muted-foreground">
                  Hit Publish in the toolbar to generate your QR code and shareable link.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
