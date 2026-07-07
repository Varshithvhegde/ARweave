import { NextRequest, NextResponse } from "next/server";
import { getExperience } from "@/lib/experienceStore";

const DUCK = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let config = getExperience(slug);

  // Seed demo
  if (!config && slug === "untitled-experience") {
    config = {
      slug,
      name: "Demo — Duck on Hiro",
      modelUrl: DUCK,
      markerUrl: null,
      scale: 1,
      animation: "spin",
      createdAt: new Date().toISOString(),
    };
  }

  if (!config) {
    const html = `<!DOCTYPE html><html><body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center">
      <div><h2>Experience not found</h2><p style="color:#888">Slug: ${slug}</p><a href="/" style="color:#a78bfa">Go home</a></div>
    </body></html>`;
    return new NextResponse(html, { status: 404, headers: { "Content-Type": "text/html" } });
  }

  const { modelUrl, markerUrl, scale, animation, name } = config;

  // Build A-Frame animation attribute string
  const s = `${scale} ${scale} ${scale}`;
  const animAttr = animation === "spin"
    ? `property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear`
    : animation === "float"
    ? `property: position; from: 0 0.1 0; to: 0 0.3 0; dir: alternate; loop: true; dur: 1500; easing: easeInOutSine`
    : animation === "pulse"
    ? `property: scale; from: ${scale * 0.9} ${scale * 0.9} ${scale * 0.9}; to: ${scale * 1.1} ${scale * 1.1} ${scale * 1.1}; dir: alternate; loop: true; dur: 900; easing: easeInOutSine`
    : "";
  const animTag = animAttr ? `animation="${animAttr}"` : "";

  const scene = markerUrl
    ? /* Image NFT tracking */`
      <a-nft type="nft" url="${markerUrl}" smooth="true" smoothCount="10" smoothTolerance="0.01" smoothThreshold="5">
        <a-entity gltf-model="${modelUrl}" scale="${s}" position="0 0 0" rotation="-90 0 0" ${animTag}></a-entity>
      </a-nft>
      <a-entity camera></a-entity>`
    : /* Hiro marker */`
      <a-marker preset="hiro">
        <a-entity gltf-model="${modelUrl}" scale="${s}" position="0 0.5 0" ${animTag}></a-entity>
      </a-marker>
      <a-entity camera></a-entity>`;

  const arjsAttr = markerUrl
    ? `arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"`
    : `arjs="sourceType: webcam; debugUIEnabled: false; patternRatio: 0.75;"`;

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <title>${name} · ARweave</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
      #loading {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: #08080f; color: #fff; font-family: -apple-system, sans-serif; gap: 16px;
      }
      #loading .logo {
        width: 52px; height: 52px; border-radius: 14px;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        display: flex; align-items: center; justify-content: center; font-size: 24px;
        box-shadow: 0 4px 20px rgba(124,58,237,0.4);
      }
      #loading h2 { font-size: 18px; font-weight: 700; }
      #loading p  { font-size: 13px; color: #888; }
      #loading .spinner {
        width: 32px; height: 32px; border: 3px solid #333;
        border-top-color: #a78bfa; border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      #hud {
        position: fixed; top: 0; left: 0; right: 0; z-index: 8000; pointer-events: none;
        padding: 14px 16px;
        background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
        display: flex; align-items: center; justify-content: space-between;
        font-family: -apple-system, sans-serif;
      }
      #hud .brand { display: flex; align-items: center; gap: 8px; }
      #hud .badge {
        width: 28px; height: 28px; border-radius: 8px;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        display: flex; align-items: center; justify-content: center; font-size: 14px;
      }
      #hud .name  { color: #fff; font-size: 13px; font-weight: 700; }
      #hud .hint  {
        background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
        border-radius: 20px; padding: 5px 12px;
        color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 500;
      }
    </style>
    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
    <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js"></script>
  </head>
  <body>
    <!-- Loading screen shown until A-Frame is ready -->
    <div id="loading">
      <div class="logo">⬡</div>
      <div class="spinner"></div>
      <h2>Loading AR…</h2>
      <p>${markerUrl ? "Point at your marker image" : "Point at the Hiro marker"}</p>
    </div>

    <!-- HUD overlay -->
    <div id="hud">
      <div class="brand">
        <div class="badge">⬡</div>
        <span class="name">ARweave</span>
      </div>
      <div class="hint">${markerUrl ? "Point at marker" : "Point at Hiro marker"}</div>
    </div>

    <a-scene
      ${arjsAttr}
      vr-mode-ui="enabled: false"
      renderer="logarithmicDepthBuffer: true; precision: medium; antialias: true;"
      loading-screen="dotsColor: #a78bfa; backgroundColor: #08080f"
    >
      <a-assets>
        <a-asset-item id="model" src="${modelUrl}"></a-asset-item>
      </a-assets>
      ${scene}
    </a-scene>

    <script>
      // Hide loading screen once A-Frame scene is loaded
      document.querySelector('a-scene').addEventListener('loaded', function () {
        var el = document.getElementById('loading');
        if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.5s'; setTimeout(function(){ el.style.display='none'; }, 500); }
      });
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
