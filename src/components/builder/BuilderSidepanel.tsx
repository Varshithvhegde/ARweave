"use client";
import { useRef, useState } from "react";
import { Upload, Box, Scan, Settings2, QrCode, Copy, Check, Loader2, X, Image as ImageIcon } from "lucide-react";
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

export default function BuilderSidepanel({ slug: _slug }: { slug: string }) {
  const {
    activePanel, setActivePanel,
    scale, setScale,
    animation, setAnimation,
    modelUrl, modelName, setModel, setModelFromUrl, clearModel,
    markerUrl, markerMindUrl, setMarker, setMarkerImageUrl, setMarkerMindUrl, clearMarker,
    overlayType, overlayUrl, overlayStorageUrl, overlayWidth, overlayHeight,
    setOverlay, setOverlayStorageUrl, setOverlayDimensions, clearOverlay,
    isPublished, publishedSlug,
    baseUrl, setBaseUrl,
  } = useBuilderStore();

  const markerInputRef  = useRef<HTMLInputElement>(null);
  const modelInputRef   = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied]                   = useState(false);
  const [compilingMarker, setCompilingMarker] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [uploadingOverlay, setUploadingOverlay] = useState(false);

  const effectiveBase = baseUrl.trim() || (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = publishedSlug && effectiveBase ? `${effectiveBase}/ar/${publishedSlug}` : null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const handleMarkerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMarker(file);
    setCompilingMarker(true);
    setCompileProgress(0);
    toast.loading("Compiling marker… 0%", { id: "marker" });

    try {
      // 1. Upload image to Supabase immediately so it persists and shows in builder on refresh
      const imgFd = new FormData();
      imgFd.append("file", file);
      imgFd.append("type", "marker");
      const imgRes = await fetch("/api/upload", { method: "POST", body: imgFd });
      if (imgRes.ok) {
        const { url: imageUrl } = await imgRes.json();
        setMarkerImageUrl(imageUrl); // updates markerUrl (canvas preview) + markerImageUrl
      }

      // 2. Draw image onto canvas to get raw pixels for the worker
      const bitmap = await createImageBitmap(file);
      const MAX = 1024;
      const ratio = Math.min(MAX / bitmap.width, MAX / bitmap.height, 1);
      const w = Math.round(bitmap.width  * ratio);
      const h = Math.round(bitmap.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);

      // Run compilation in a Web Worker — keeps the UI responsive
      const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const worker = new Worker("/mindar-worker.js", { type: "module" });

        worker.onmessage = (ev) => {
          const { type, buffer, progress, message } = ev.data;
          if (type === "progress") {
            const pct = Math.min(99, progress);
            setCompileProgress(pct);
            toast.loading(`Compiling marker… ${pct}%`, { id: "marker" });
          } else if (type === "done") {
            worker.terminate();
            resolve(buffer);
          } else if (type === "error") {
            worker.terminate();
            reject(new Error(message));
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          reject(new Error(err.message));
        };

        // Copy pixel data to worker (don't transfer — we might need imageData later)
        worker.postMessage({ imageData: imageData.data.buffer.slice(0), width: w, height: h });
      });

      toast.loading("Uploading…", { id: "marker" });

      // Upload compiled .mind to Supabase via server route
      const fd = new FormData();
      fd.append("mind", new File([buffer], "marker.mind", { type: "application/octet-stream" }));
      const res = await fetch("/api/upload-mind", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      setMarkerMindUrl(url);
      toast.success("Marker ready!", { id: "marker", description: "Image compiled and uploaded" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Marker compile failed", { id: "marker" });
      clearMarker();
    } finally {
      setCompilingMarker(false);
      setCompileProgress(0);
    }
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModel(file);
    toast.success(`Model "${file.name}" loaded!`);
  };

  const handleOverlayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOverlay(file);
    setUploadingOverlay(true);
    toast.loading("Uploading overlay…", { id: "overlay" });
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "overlay");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setOverlayStorageUrl(url);
      // Auto-set aspect ratio from image
      if (file.type.startsWith("image")) {
        const img = new window.Image();
        img.onload = () => {
          const ratio = img.naturalHeight / img.naturalWidth;
          setOverlayDimensions(1, parseFloat(ratio.toFixed(3)));
        };
        img.src = URL.createObjectURL(file);
      }
      toast.success("Overlay ready!", { id: "overlay" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed", { id: "overlay" });
      clearOverlay();
    } finally {
      setUploadingOverlay(false);
    }
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
        <Tab active={activePanel === "overlay"}  onClick={() => setActivePanel("overlay")}>
          <ImageIcon className="w-3 h-3 inline mr-1" />Overlay
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
                type="range" min={0.02} max={2} step={0.01}
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[var(--brand)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>tiny</span><span>large</span>
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
                Upload any photo or image. We compile it into an AR tracking target automatically.
              </p>
              <input ref={markerInputRef} type="file" accept="image/*" className="hidden" onChange={handleMarkerUpload} disabled={compilingMarker} />
              <button
                onClick={() => !compilingMarker && markerInputRef.current?.click()}
                disabled={compilingMarker}
                className="w-full border-2 border-dashed border-border rounded-xl overflow-hidden hover:border-[var(--brand)] transition-colors group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {compilingMarker ? (
                  <div className="p-6 flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--brand)]" />
                    <p className="text-xs text-muted-foreground font-medium">Compiling marker…</p>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full brand-gradient transition-all duration-300"
                        style={{ width: `${compileProgress || 5}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{compileProgress}% — UI stays responsive</p>
                  </div>
                ) : markerUrl || markerMindUrl ? (
                  // Show local blob preview, or a placeholder if only mindUrl exists (after refresh)
                  markerUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={markerUrl} alt="Marker preview" className="w-full h-36 object-cover" />
                    : (
                      <div className="p-5 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                          <Scan className="w-5 h-5 text-emerald-500" />
                        </div>
                        <p className="text-xs text-emerald-600 font-medium">Marker compiled ✓</p>
                        <p className="text-[10px] text-muted-foreground">Tap to replace</p>
                      </div>
                    )
                ) : (
                  <div className="p-5 text-center">
                    <Scan className="w-6 h-6 mx-auto text-muted-foreground group-hover:text-[var(--brand)] mb-2 transition-colors" />
                    <p className="text-xs text-muted-foreground group-hover:text-foreground">
                      Upload any image<br />JPG · PNG · WebP
                    </p>
                  </div>
                )}
              </button>

              {(markerUrl || markerMindUrl) && !compilingMarker && (
                <div className="flex gap-2 mt-2">
                  <div className={cn(
                    "flex items-center gap-1.5 flex-1 rounded-lg px-3 py-1.5 border",
                    markerMindUrl
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  )}>
                    <div className={cn("w-2 h-2 rounded-full shrink-0", markerMindUrl ? "bg-emerald-500" : "bg-amber-500")} />
                    <span className={cn("text-xs font-medium", markerMindUrl ? "text-emerald-600" : "text-amber-600")}>
                      {markerMindUrl ? "Marker compiled ✓" : "Compiling…"}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => markerInputRef.current?.click()}>Change</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-8 text-destructive hover:text-destructive" onClick={clearMarker}>✕</Button>
                </div>
              )}
            </div>

            <Separator />

            <div className="rounded-xl bg-muted/60 border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground">Tips for best tracking</p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• High contrast, lots of unique detail</li>
                <li>• Avoid plain colors or solid backgrounds</li>
                <li>• Minimum 300×300px image</li>
                <li>• Good lighting when scanning</li>
              </ul>
            </div>

            {!markerUrl && (
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Skip — use Hiro marker</p>
                <p className="text-xs text-blue-600/80 mb-2">
                  Don&apos;t have a custom image? Use the standard Hiro marker instead.
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

        {/* ── OVERLAY PANEL ── */}
        {activePanel === "overlay" && (
          <>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Image or video overlay
              </Label>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Place a 2D image or video flat on top of your marker. Great for logos, photos, product shots, or promo videos.
              </p>

              <input
                ref={overlayInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                className="hidden"
                onChange={handleOverlayUpload}
                disabled={uploadingOverlay}
              />

              <button
                onClick={() => !uploadingOverlay && overlayInputRef.current?.click()}
                disabled={uploadingOverlay}
                className="w-full border-2 border-dashed border-border rounded-xl overflow-hidden hover:border-[var(--brand)] transition-colors group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadingOverlay ? (
                  <div className="p-5 flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--brand)]" />
                    <p className="text-xs text-muted-foreground">Uploading…</p>
                  </div>
                ) : overlayUrl && overlayType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={overlayUrl} alt="Overlay preview" className="w-full h-32 object-contain bg-muted/40 p-2" />
                ) : overlayType === "video" ? (
                  <div className="p-5 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                      <span className="text-xl">🎬</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Video overlay ready</p>
                  </div>
                ) : (
                  <div className="p-5 text-center">
                    <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground group-hover:text-[var(--brand)] mb-2 transition-colors" />
                    <p className="text-xs text-muted-foreground group-hover:text-foreground">
                      Upload image or video<br />JPG · PNG · WebP · MP4
                    </p>
                  </div>
                )}
              </button>

              {overlayStorageUrl && (
                <div className="flex gap-2 mt-2">
                  <div className="flex items-center gap-1.5 flex-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs text-emerald-600 font-medium">
                      {overlayType === "video" ? "Video" : "Image"} uploaded ✓
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => overlayInputRef.current?.click()}>Change</Button>
                  <Button variant="ghost" size="sm" className="text-xs h-8 text-destructive hover:text-destructive" onClick={clearOverlay}>✕</Button>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Width</Label>
                  <span className="text-xs font-mono">{overlayWidth.toFixed(2)}</span>
                </div>
                <input
                  type="range" min={0.1} max={3} step={0.05}
                  value={overlayWidth}
                  onChange={(e) => setOverlayDimensions(parseFloat(e.target.value), overlayHeight)}
                  className="w-full h-1.5 accent-[var(--brand)] cursor-pointer"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Height</Label>
                  <span className="text-xs font-mono">{overlayHeight.toFixed(2)}</span>
                </div>
                <input
                  type="range" min={0.1} max={3} step={0.05}
                  value={overlayHeight}
                  onChange={(e) => setOverlayDimensions(overlayWidth, parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-[var(--brand)] cursor-pointer"
                />
              </div>
            </div>

            <div className="rounded-xl bg-muted/60 border border-border p-3 space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Tips</p>
              <p className="text-xs text-muted-foreground">• Image floats flat on the marker</p>
              <p className="text-xs text-muted-foreground">• Use PNG with transparency for logos</p>
              <p className="text-xs text-muted-foreground">• Video loops automatically</p>
              <p className="text-xs text-muted-foreground">• Can combine with 3D model</p>
            </div>
          </>
        )}

        {/* ── SHARE PANEL ── */}
        {activePanel === "settings" && (
          <>
            {/* Base URL override — key for ngrok testing */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                Base URL
              </Label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://xxxx.ngrok-free.app"
                className="w-full text-xs bg-muted border border-border rounded-lg px-3 py-2 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Leave blank to use <span className="font-mono">{typeof window !== "undefined" ? window.location.origin : "localhost"}</span>
                {" "}· Paste ngrok URL to test on phone.
              </p>
            </div>

            <Separator />

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
