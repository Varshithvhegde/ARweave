import { NextRequest, NextResponse } from "next/server";
import { getExperience } from "@/lib/experienceStore";

const DUCK   = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb";
const AFRAME = "https://aframe.io/releases/1.3.0/aframe.min.js";
const ARJS   = "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/aframe/build/aframe-ar.js";

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
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center">
        <div><h2>Experience not found</h2><p style="color:#666;margin-top:8px">slug: ${slug}</p></div>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  const { modelUrl, scale, animation, name } = config;
  const s = scale;

  const animAttr = animation === "spin"
    ? `property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear`
    : animation === "float"
    ? `property: position; from: 0 0.5 0; to: 0 0.8 0; dir: alternate; loop: true; dur: 1500; easing: easeInOutSine`
    : animation === "pulse"
    ? `property: scale; from: ${s*0.9} ${s*0.9} ${s*0.9}; to: ${s*1.1} ${s*1.1} ${s*1.1}; dir: alternate; loop: true; dur: 900`
    : "";
  const animTag = animAttr ? `animation="${animAttr}"` : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <title>${name} · ARweave</title>

  <!-- Scripts MUST be in <head> per A-Frame requirement -->
  <script src="${AFRAME}"></script>
  <script src="${ARJS}"></script>

  <style>
    * { margin: 0; padding: 0; }
    html, body { overflow: hidden; width: 100%; height: 100%; }
    .a-canvas { background: transparent !important; }
    #hud {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      pointer-events: none; padding: 14px 16px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent);
      display: flex; align-items: center; justify-content: space-between;
      font-family: -apple-system, sans-serif;
    }
    .hud-left { display: flex; align-items: center; gap: 8px; }
    .hud-icon { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg,#7c3aed,#a855f7); display:flex; align-items:center; justify-content:center; font-size:13px; color:#fff; }
    .hud-name { color:#fff; font-size:13px; font-weight:700; }
    .hud-hint { background:rgba(255,255,255,0.18); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border-radius:20px; padding:5px 12px; color:#fff; font-size:11px; font-weight:500; }
    #statusbar {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      z-index: 9999; font-family: -apple-system, sans-serif; font-size: 12px;
      color: rgba(255,255,255,0.9); background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      border-radius: 20px; padding: 6px 16px; white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="hud">
    <div class="hud-left">
      <div class="hud-icon">⬡</div>
      <span class="hud-name">ARweave · ${name}</span>
    </div>
    <div class="hud-hint">Point at Hiro marker</div>
  </div>
  <div id="statusbar" id="statusbar">Loading…</div>

  <a-scene
    embedded
    arjs="sourceType: webcam; debugUIEnabled: false; patternRatio: 0.75;"
    vr-mode-ui="enabled: false"
    loading-screen="enabled: false"
    renderer="logarithmicDepthBuffer: true; precision: medium; antialias: true; alpha: true;"
  >
    <a-assets>
      <a-asset-item id="duck" src="${modelUrl}" response-type="arraybuffer"></a-asset-item>
    </a-assets>

    <a-marker preset="hiro">
      <!-- Visible box so we can confirm marker tracking works even if GLB fails -->
      <a-box
        position="0 0.5 0"
        scale="0.5 0.5 0.5"
        color="#7c3aed"
        opacity="0.85"
        ${animTag}
      ></a-box>

      <!-- GLB model on top of the box — loads async -->
      <a-entity
        gltf-model="#duck"
        scale="${s} ${s} ${s}"
        position="0 0 0"
        ${animTag}
      ></a-entity>
    </a-marker>

    <a-entity camera></a-entity>
  </a-scene>

  <script>
    var bar = document.getElementById('statusbar');
    var scene = document.querySelector('a-scene');

    scene.addEventListener('loaded', function() {
      bar.textContent = 'Camera active · Point at Hiro marker';
    });

    // Track asset loading
    var assets = document.querySelector('a-assets');
    assets.addEventListener('loaded', function() {
      bar.textContent = 'Model loaded · Point at Hiro marker';
    });
    assets.addEventListener('timeout', function() {
      bar.textContent = 'Model load timeout — box will still show';
    });

    // Camera permission check
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(function(s) { s.getTracks().forEach(function(t){ t.stop(); }); })
      .catch(function(e) {
        bar.textContent = 'Camera error: ' + e.message;
        bar.style.color = '#f87171';
      });

    // iOS keep video alive
    document.addEventListener('touchend', function() {
      var v = document.querySelector('video');
      if (v && v.paused) v.play().catch(function(){});
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
