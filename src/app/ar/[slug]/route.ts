import { NextRequest, NextResponse } from "next/server";
import { getExperience } from "@/lib/experienceStore";

const DUCK   = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb";
const AFRAME = "https://aframe.io/releases/1.3.0/aframe.min.js";
const ARJS   = "https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let config = getExperience(slug);

  if (!config && slug === "untitled-experience") {
    config = {
      slug,
      name: "Demo",
      modelUrl: DUCK,
      markerUrl: null,
      scale: 1,
      animation: "spin",
      createdAt: new Date().toISOString(),
    };
  }

  if (!config) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center"><h2>Not found</h2><p style="color:#666;margin-top:8px">${slug}</p></div>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  const { modelUrl, scale, animation } = config;
  const s = scale;

  const animAttr = animation === "spin"
    ? `property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear`
    : animation === "float"
    ? `property: position; from: 0 0.5 0; to: 0 0.8 0; dir: alternate; loop: true; dur: 1500; easing: easeInOutSine`
    : animation === "pulse"
    ? `property: scale; from: ${s*0.9} ${s*0.9} ${s*0.9}; to: ${s*1.1} ${s*1.1} ${s*1.1}; dir: alternate; loop: true; dur: 900`
    : "";
  const animTag = animAttr ? `animation="${animAttr}"` : "";

  // This is the EXACT structure from the official AR.js docs — do not deviate
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <title>ARweave</title>
  <script src="${AFRAME}"></script>
  <script src="${ARJS}"></script>
  <style>
    /* Official AR.js requirement: no margin, no overflow */
    body { margin: 0; overflow: hidden; }

    /* HUD — must be fixed + high z-index */
    #hud {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      pointer-events: none; padding: 12px 16px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
      display: flex; align-items: center; justify-content: space-between;
      font-family: -apple-system, sans-serif;
    }
    .left { display: flex; align-items: center; gap: 8px; }
    .dot  { width:26px; height:26px; border-radius:8px; background:linear-gradient(135deg,#7c3aed,#a855f7); display:flex; align-items:center; justify-content:center; font-size:12px; color:#fff; }
    .nm   { color:#fff; font-size:13px; font-weight:700; }
    .hint { background:rgba(255,255,255,0.18); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border-radius:20px; padding:4px 12px; color:#fff; font-size:11px; font-weight:500; }
  </style>
</head>
<body>
  <div id="hud">
    <div class="left">
      <div class="dot">⬡</div>
      <span class="nm">ARweave</span>
    </div>
    <div class="hint" id="hint">Point at Hiro marker</div>
  </div>

  <!--
    CANONICAL AR.js setup:
    - embedded + arjs together, no extra arjs params (use defaults)
    - alpha:true on renderer so canvas is see-through
    - NO loading-screen="enabled:false" — let A-Frame handle it
  -->
  <a-scene
    embedded
    arjs="sourceType: webcam; debugUIEnabled: false;"
    vr-mode-ui="enabled: false"
    renderer="logarithmicDepthBuffer: true; alpha: true;"
  >
    <a-marker preset="hiro" id="m">
      <!-- Simple red box — 100% confirms detection before relying on GLB -->
      <a-box
        position="0 0.5 0"
        rotation="0 0 0"
        scale="0.8 0.8 0.8"
        color="#e11d48"
        opacity="1"
      ></a-box>
      <a-entity
        gltf-model="${modelUrl}"
        scale="${s} ${s} ${s}"
        position="0 0 0"
        ${animTag}
      ></a-entity>
    </a-marker>

    <a-entity camera></a-entity>
  </a-scene>

  <script>
    var hint = document.getElementById('hint');
    var marker = document.getElementById('m');

    marker.addEventListener('markerFound', function() {
      hint.textContent = '✓ Marker detected!';
      hint.style.background = 'rgba(5,150,105,0.8)';
    });
    marker.addEventListener('markerLost', function() {
      hint.textContent = 'Point at Hiro marker';
      hint.style.background = 'rgba(255,255,255,0.18)';
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
