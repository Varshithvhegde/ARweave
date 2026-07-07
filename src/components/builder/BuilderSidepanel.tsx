"use client";
import { useRef, useState } from "react";
import { Upload, Box, Scan, Settings2, QrCode, Copy, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useBuilderStore, type AnimationType } from "@/lib/builderStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QRCodeSVG as QRCode } from "qrcode.react";

const ANIMATIONS: { value: AnimationType; label: string; icon: string }[] = [
  { value: "none",  label: "None",  icon: "⏹" },
  { value: "spin",  label: "Spin",  icon: "🔄" },
  { value: "float", label: "Float", icon: "🌊" },
  { value: "pulse", label: "Pulse", icon: "💓" },
];

const FREE_MODELS = [
  { name: "Duck",    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb",         icon: "🦆" },
  { name: "Box",     url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb",           icon: "📦" },
  { name: "Helmet",  url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb", icon: "⛑" },
  { name: "Lantern", url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Lantern/glTF-Binary/Lantern.glb",   icon: "🏮" },
  { name: "Fox",     url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb",           icon: "🦊" },
  { name: "Avocado", url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb",   icon: "🥑" },
];

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 py-2.5 text-xs font-semibold transition-colors",
        active ? "text-foreground border-b-2 border-[var(--brand)]" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default function BuilderSidepanel() {
  const {
    activePanel, setActivePanel,
    scale, setScale,
    animation, setAnimation,
    modelUrl, modelName, setModel, setModelFromUrl, clearModel,
    markerUrl, setMarker, clearMarker,
    isPublished, publishedSlug,
  } = useBuilderStore();

  const markerInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef  = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // Build the full share URL using the current host (works with ngrok)
  const shareUrl = publishedSlug && typeof window !== "undefined"
    ? `${window.location.origin}/ar/${publishedSlug}`
    : null;

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
    setMarker(file);
    toast.success("Marker image set!");
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModel(file);
    toast.success(`Model "${file.name}" loaded!`);
  };

  const handleFreeModel = (m: typeof FREE_MODELS[0]) => {
    setModelFromUrl(m.url, m.name);
    toast.success(`${m.icon} ${m.name} loaded!`);
  };

  return (
    <aside className="w-64 border-l border-border bg-card flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-border px-1 shrink-0">
        <Tab active={activePanel === "model"}    onClick={() => setActivePanel("model")}>
          <Box className="w-3 h-3 inline mr-1" />Model
        </Tab>
        <Tab active={activePanel === "marker"}   onClick={() => setActivePanel("marker")}>
          <Scan className="w-3 h-3 inline mr-1" />Marker
        </Tab>
        <Tab active={activePanel === "settings"} onClick={() => setActivePanel("settings")}>
          <Settings2 className="w-3 h-3 inline mr-1" />Share
        </Tab>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ── MODEL PANEL ── */}
        {activePanel === "model" && (
          <>
            {/* Active model badge */}
            {modelUrl && (
              <div className="flex items-center gap-2 rounded-lg bg-[var(--brand-muted)] border border-[var(--brand)]/30 px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-[var(--brand)] shrink-0" />
                <span className="text-xs font-medium text-[var(--brand)] truncate flex-1">{modelName ?? "Model loaded"}</span>
                <button onClick={clearModel} aria-label="Remove model">
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
              </div>
            )}

            {/* Upload */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Upload GLB / GLTF
              </Label>
              <input ref={modelInputRef} type="file" accept=".glb,.gltf" className="hidden" onChange={handleModelUpload} />
              <button
                onClick={() => modelInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-[var(--brand)] hover:bg-[var(--brand-muted)] transition-colors group"
              >
                <Upload className="w-5 h-5 mx-auto text-muted-foreground group-hover:text-[var(--brand)] mb-1.5 transition-colors" />
                <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  Drop GLB file here<br />or click to browse
                </p>
              </button>
            </div>

            <Separator />

            {/* Free model library */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Free model library
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {FREE_MODELS.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => handleFreeModel(m)}
                    className={cn(
                      "aspect-square rounded-xl border bg-muted transition-colors flex flex-col items-center justify-center gap-1 text-xs",
                      modelUrl === m.url
                        ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]"
                        : "border-border text-muted-foreground hover:border-[var(--brand)] hover:bg-[var(--brand-muted)] hover:text-foreground"
                    )}
                    title={m.name}
                  >
                    <span className="text-lg leading-none">{m.icon}</span>
                    <span className="font-medium">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Scale */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scale</Label>
                <span className="text-xs font-mono text-foreground">{scale.toFixed(1)}x</span>
              </div>
              <input
                type="range" min={0.1} max={5} step={0.1}
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[var(--brand)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0.1x</span><span>5x</span>
              </div>
            </div>

            {/* Animation */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Animation</Label>
              <div className="grid grid-cols-2 gap-2">
                {ANIMATIONS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setAnimation(a.value)}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5",
                      animation === a.value
                        ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    )}
                  >
                    <span>{a.icon}</span>{a.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── MARKER PANEL ── */}
        {activePanel === "marker" && (
          <>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Marker image
              </Label>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Upload any image. The phone camera will detect it and place your 3D model on top.
              </p>
              <input ref={markerInputRef} type="file" accept="image/*" className="hidden" onChange={handleMarkerUpload} />
              <button
                onClick={() => markerInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl overflow-hidden hover:border-[var(--brand)] transition-colors group"
              >
                {markerUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={markerUrl} alt="Marker preview" className="w-full h-36 object-cover" />
                  : (
                    <div className="p-5 text-center">
                      <Scan className="w-6 h-6 mx-auto text-muted-foreground group-hover:text-[var(--brand)] mb-2 transition-colors" />
                      <p className="text-xs text-muted-foreground group-hover:text-foreground">
                        Upload marker image<br />JPG · PNG · WebP
                      </p>
                    </div>
                  )
                }
              </button>

              {markerUrl && (
                <div className="flex gap-2 mt-2">
                  <div className="flex items-center gap-1.5 flex-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs text-emerald-600 font-medium">Marker set</span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => markerInputRef.current?.click()}>Change</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-8 text-destructive hover:text-destructive" onClick={clearMarker}>Remove</Button>
                </div>
              )}
            </div>

            <Separator />

            <div className="rounded-xl bg-muted/60 border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground">Tips for best tracking</p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• High contrast, lots of unique detail</li>
                <li>• Avoid plain colors or gradients</li>
                <li>• Min 300×300px image size</li>
                <li>• Good lighting when scanning</li>
              </ul>
            </div>

            {!markerUrl && (
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">No marker? Use Hiro</p>
                <p className="text-xs text-blue-600/80 mb-2">
                  Skip the marker — the AR viewer will use the standard Hiro marker instead. Print it from below.
                </p>
                <a
                  href="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png"
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs underline text-blue-600 font-medium"
                >
                  Download Hiro marker →
                </a>
              </div>
            )}
          </>
        )}

        {/* ── SHARE PANEL ── */}
        {activePanel === "settings" && (
          <>
            {isPublished && shareUrl ? (
              <>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                    AR viewer link
                  </Label>
                  <div className="flex gap-2">
                    <input
                      readOnly value={shareUrl}
                      className="flex-1 text-xs bg-muted border border-border rounded-lg px-3 py-2 font-mono min-w-0"
                    />
                    <Button size="icon" variant="outline" className="shrink-0 h-9 w-9" onClick={handleCopy} aria-label="Copy link">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Open on your phone, allow camera, point at the marker.
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">
                    QR code — scan to open AR
                  </Label>
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-xl border border-border shadow-sm">
                      <QRCode value={shareUrl} size={148} level="M" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      Scan with your phone to launch the AR experience
                    </p>
                  </div>
                </div>

                {!markerUrl && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                    <p className="text-xs text-amber-600 font-medium mb-1">Using Hiro marker</p>
                    <p className="text-xs text-amber-600/80">
                      No marker was set. The AR viewer will look for the Hiro pattern marker.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Not published yet</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
                  Add a 3D model then hit <strong>Publish</strong> to get your QR code.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
