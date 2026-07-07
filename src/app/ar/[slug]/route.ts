import { NextRequest, NextResponse } from "next/server";
import { getExperience } from "@/lib/experienceStore";

const DUCK = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let config = getExperience(slug);

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
      <div><h2>Experience not found</h2><p style="color:#888;margin-top:8px">Slug: ${slug}</p><a href="/" style="color:#a78bfa;margin-top:16px;display:block">Go home</a></div>
    </body></html>`;
    return new NextResponse(html, { status: 404, headers: { "Content-Type": "text/html" } });
  }

  const { modelUrl, markerUrl, scale, animation, name } = config;
  const s = `${scale} ${scale} ${scale}`;

  const animAttr = animation === "spin"
    ? `property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear`
    : animation === "float"
    ? `property: position; from: 0 0.5 0; to: 0 0.8 0; dir: alternate; loop: true; dur: 1500; easing: easeInOutSine`
    : animation === "pulse"
    ? `property: scale; from: ${scale * 0.9} ${scale * 0.9} ${scale * 0.9}; to: ${scale * 1.1} ${scale * 1.1} ${scale * 1.1}; dir: alternate; loop: true; dur: 900; easing: easeInOutSine`
    : "";
  const animTag = animAttr ? `animation="${animAttr}"` : "";

  const markerBlock = markerUrl
    ? `<a-nft type="nft" url="${markerUrl}" smooth="true" smoothCount="10" smoothTolerance="0.01" smoothThreshold="5">
        <a-entity gltf-model="${modelUrl}" scale="${s}" position="0 0 0" rotation="-90 0 0" ${animTag}></a-entity>
       </a-nft>`
    : `<a-marker preset="hiro">
        <a-entity gltf-model="${modelUrl}" scale="${s}" position="0 0.5 0" ${animTag}></a-entity>
       </a-marker>`;

  const arjsAttr = markerUrl
    ? `detectionMode: mono_and_matrix; matrixCodeType: 3x3;`
    : `patternRatio: 0.75;`;

  const hint = markerUrl ? "Point camera at your marker image" : "Point camera at the Hiro marker";

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
    <title>${name} · ARweave</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }

      html, body {
        width:100%; height:100%;
        overflow:hidden;
        background:#000;
      }

      /* A-Frame canvas must be transparent so the video shows through */
      a-scene { display:block; width:100vw; height:100vh; }

      /* AR.js injects a <video> — force it to fill screen behind everything */
      video {
        position:fixed !important;
        top:0 !important; left:0 !important;
        width:100vw !important; height:100vh !important;
        object-fit:cover !important;
        z-index:0 !important;
      }

      /* A-Frame canvas sits on top of video, transparent background */
      canvas {
        position:fixed !important;
        top:0 !important; left:0 !important;
        width:100vw !important; height:100vh !important;
        z-index:1 !important;
      }

      /* Loading overlay */
      #loading {
        position:fixed; inset:0; z-index:9999;
        display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:16px;
        background:#08080f; color:#fff;
        font-family:-apple-system,BlinkMacSystemFont,sans-serif;
        transition: opacity 0.6s ease;
      }
      .spinner {
        width:36px; height:36px;
        border:3px solid #2d2d4e;
        border-top-color:#a78bfa;
        border-radius:50%;
        animation:spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform:rotate(360deg); } }
      .logo-box {
        width:56px; height:56px; border-radius:16px;
        background:linear-gradient(135deg,#7c3aed,#a855f7);
        display:flex; align-items:center; justify-content:center;
        font-size:26px; box-shadow:0 4px 24px rgba(124,58,237,0.5);
      }
      #loading h2 { font-size:18px; font-weight:700; }
      #loading p  { font-size:13px; color:#888; text-align:center; max-width:220px; line-height:1.5; }

      /* HUD — always on top */
      #hud {
        position:fixed; top:0; left:0; right:0; z-index:8000;
        pointer-events:none;
        padding:14px 16px;
        background:linear-gradient(to bottom,rgba(0,0,0,0.65),transparent);
        display:flex; align-items:center; justify-content:space-between;
        font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      }
      .hud-brand { display:flex; align-items:center; gap:8px; }
      .hud-badge {
        width:28px; height:28px; border-radius:8px;
        background:linear-gradient(135deg,#7c3aed,#a855f7);
        display:flex; align-items:center; justify-content:center; font-size:13px;
      }
      .hud-name  { color:#fff; font-size:13px; font-weight:700; }
      .hud-hint  {
        background:rgba(255,255,255,0.15);
        backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
        border-radius:20px; padding:5px 12px;
        color:rgba(255,255,255,0.9); font-size:11px; font-weight:500;
      }
    </style>
  </head>
  <body>

    <!-- Loading screen -->
    <div id="loading">
      <div class="logo-box">⬡</div>
      <div class="spinner"></div>
      <h2>Loading AR…</h2>
      <p>${hint}</p>
    </div>

    <!-- HUD -->
    <div id="hud">
      <div class="hud-brand">
        <div class="hud-badge">⬡</div>
        <span class="hud-name">ARweave</span>
      </div>
      <div class="hud-hint">${hint}</div>
    </div>

    <!-- A-Frame + AR.js loaded synchronously so scene registers before body parses -->
    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
    <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js"></script>

    <a-scene
      arjs="sourceType: webcam; debugUIEnabled: false; ${arjsAttr}"
      vr-mode-ui="enabled: false"
      loading-screen="enabled: false"
      renderer="logarithmicDepthBuffer: true; precision: medium; antialias: true; alpha: true;"
    >
      <a-assets timeout="10000">
        <a-asset-item id="ar-model" src="${modelUrl}"></a-asset-item>
      </a-assets>

      ${markerBlock}
      <a-entity camera></a-entity>
    </a-scene>

    <script>
      var scene = document.querySelector('a-scene');
      var loading = document.getElementById('loading');

      // Hide loading once scene is ready
      scene.addEventListener('loaded', function () {
        loading.style.opacity = '0';
        setTimeout(function () { loading.style.display = 'none'; }, 600);
      });

      // Fallback — hide after 8s even if event doesn't fire
      setTimeout(function () {
        loading.style.opacity = '0';
        setTimeout(function () { loading.style.display = 'none'; }, 600);
      }, 8000);

      // iOS Safari needs user gesture to start camera on some versions
      document.addEventListener('touchstart', function startCamera() {
        var video = document.querySelector('video');
        if (video && video.paused) video.play().catch(function(){});
        document.removeEventListener('touchstart', startCamera);
      }, { once: true });
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
