import { NextRequest, NextResponse } from "next/server";
import { getExperience } from "@/lib/experienceStore";

const DUCK = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb";

// Pinned versions known to work together
const AFRAME = "https://aframe.io/releases/1.3.0/aframe.min.js";
const ARJS_MARKER = "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/aframe/build/aframe-ar.js";
const ARJS_NFT    = "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/aframe/build/aframe-ar-nft.js";

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
    return new NextResponse(notFoundHtml(slug), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
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

  // Use Hiro marker (simple pattern-based) or NFT (image-based)
  const useNFT = !!markerUrl;
  const arjsScript = useNFT ? ARJS_NFT : ARJS_MARKER;
  const hint = useNFT
    ? "Point camera at your marker image"
    : "Point camera at the Hiro marker";

  const markerBlock = useNFT
    ? `
      <a-nft
        type="nft"
        url="${markerUrl}"
        smooth="true"
        smoothCount="10"
        smoothTolerance="0.01"
        smoothThreshold="5"
      >
        <a-entity
          gltf-model="${modelUrl}"
          scale="${s}"
          position="0 0 0"
          rotation="-90 0 0"
          ${animTag}
        ></a-entity>
      </a-nft>`
    : `
      <a-marker preset="hiro">
        <a-entity
          gltf-model="${modelUrl}"
          scale="${s}"
          position="0 0.5 0"
          ${animTag}
        ></a-entity>
      </a-marker>`;

  const arjsAttr = useNFT
    ? `sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;`
    : `sourceType: webcam; debugUIEnabled: false; patternRatio: 0.75;`;

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
    <title>${name} · ARweave</title>
    <style>
      * { margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }

      /* AR.js injects video — keep it fullscreen behind everything */
      video {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        object-fit: cover !important;
        z-index: -1 !important;
      }

      /* A-Frame canvas — transparent so video shows through */
      canvas.a-canvas {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 1 !important;
      }

      /* HUD on top */
      #hud {
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 9000;
        pointer-events: none;
        padding: 14px 16px;
        background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: -apple-system, sans-serif;
      }
      .hud-left  { display: flex; align-items: center; gap: 8px; }
      .hud-dot   { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg,#7c3aed,#a855f7); display:flex; align-items:center; justify-content:center; font-size:13px; }
      .hud-name  { color: #fff; font-size: 13px; font-weight: 700; }
      .hud-hint  { background: rgba(255,255,255,0.18); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 20px; padding: 5px 12px; color: #fff; font-size: 11px; font-weight: 500; }

      /* Status bar at bottom */
      #status {
        position: fixed;
        bottom: 32px; left: 50%;
        transform: translateX(-50%);
        z-index: 9000;
        font-family: -apple-system, sans-serif;
        font-size: 12px;
        color: rgba(255,255,255,0.7);
        background: rgba(0,0,0,0.45);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 20px;
        padding: 6px 16px;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <!-- HUD -->
    <div id="hud">
      <div class="hud-left">
        <div class="hud-dot">⬡</div>
        <span class="hud-name">ARweave</span>
      </div>
      <div class="hud-hint">${hint}</div>
    </div>

    <!-- Status -->
    <div id="status">Starting camera…</div>

    <!-- Scripts MUST load before a-scene is parsed -->
    <script src="${AFRAME}"></script>
    <script src="${arjsScript}"></script>

    <!-- embedded is REQUIRED — tells A-Frame to fit inside the page not fullscreen -->
    <a-scene
      embedded
      arjs="${arjsAttr}"
      vr-mode-ui="enabled: false"
      loading-screen="enabled: false"
      renderer="logarithmicDepthBuffer: true; precision: medium; antialias: true; alpha: true;"
      style="width:100vw; height:100vh; position:fixed; top:0; left:0;"
    >
      ${markerBlock}
      <a-entity camera></a-entity>
    </a-scene>

    <script>
      var status = document.getElementById('status');

      // Track camera state
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(function(stream) {
          status.textContent = '${hint}';
          stream.getTracks().forEach(function(t) { t.stop(); }); // AR.js will open it again
        })
        .catch(function(err) {
          status.textContent = 'Camera error: ' + err.message;
          status.style.color = '#f87171';
        });

      // Scene events
      var scene = document.querySelector('a-scene');
      scene.addEventListener('loaded', function() {
        status.textContent = '${hint}';
      });
      scene.addEventListener('arjs-video-loaded', function() {
        status.textContent = 'Camera active — ${hint}';
      });

      // iOS: tap to resume video if paused
      document.addEventListener('touchend', function() {
        var v = document.querySelector('video');
        if (v && v.paused) v.play().catch(function(){});
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

function notFoundHtml(slug: string) {
  return `<!DOCTYPE html><html><body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center">
    <div>
      <div style="font-size:48px;margin-bottom:16px">⬡</div>
      <h2 style="margin-bottom:8px">Experience not found</h2>
      <p style="color:#666;margin-bottom:16px">Slug: ${slug}</p>
      <a href="/" style="color:#a78bfa;text-decoration:none;border:1px solid #a78bfa;padding:8px 20px;border-radius:8px">Go home</a>
    </div>
  </body></html>`;
}
