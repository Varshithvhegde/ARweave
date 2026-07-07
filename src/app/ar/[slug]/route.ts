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
        <div style="text-align:center"><h2>Not found</h2><p style="color:#666">${slug}</p></div>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }

  const { modelUrl, scale, animation } = config;
  const s = scale;

  const animAttr = animation === "spin"
    ? `property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear`
    : animation === "float"
    ? `property: position; from: 0 0.5 0; to: 0 0.8 0; dir: alternate; loop: true; dur: 1500`
    : animation === "pulse"
    ? `property: scale; from: ${s*0.9} ${s*0.9} ${s*0.9}; to: ${s*1.1} ${s*1.1} ${s*1.1}; dir: alternate; loop: true; dur: 900`
    : "";
  const animTag = animAttr ? `animation="${animAttr}"` : "";

  // Absolute minimal AR.js — matches official docs exactly, debug UI enabled
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <title>ARweave</title>
  <script src="${AFRAME}"></script>
  <script src="${ARJS}"></script>
  <style>
    body { margin: 0; overflow: hidden; background: #000; }
    #hud {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      pointer-events: none; padding: 10px 14px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
      display: flex; align-items: center; justify-content: space-between;
      font-family: -apple-system, sans-serif;
    }
    .left { display:flex; align-items:center; gap:8px; }
    .dot  { width:26px; height:26px; border-radius:8px; background:linear-gradient(135deg,#7c3aed,#a855f7); display:flex; align-items:center; justify-content:center; font-size:12px; }
    .nm   { color:#fff; font-size:13px; font-weight:700; }
    #hint {
      font-family: -apple-system, sans-serif; font-size:11px; font-weight:600;
      color:#fff; background:rgba(255,255,255,0.18);
      backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
      border-radius:20px; padding:4px 12px;
      transition: background 0.3s;
    }
    #hint.found { background: rgba(5,150,105,0.85); }
    /* Debug canvas from AR.js — show it small in corner so we can see what it's scanning */
    #arjs-debug-canvas, canvas[id^="arjs-"] {
      position: fixed !important;
      bottom: 60px !important;
      right: 8px !important;
      width: 120px !important;
      height: 90px !important;
      z-index: 9998 !important;
      border: 2px solid rgba(255,255,255,0.3) !important;
      border-radius: 6px !important;
      opacity: 0.85 !important;
    }
    #bar {
      position:fixed; bottom:16px; left:50%; transform:translateX(-50%);
      z-index:9999; font-family:-apple-system,sans-serif; font-size:11px;
      color:rgba(255,255,255,0.9); background:rgba(0,0,0,0.6);
      backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
      border-radius:20px; padding:5px 14px; white-space:nowrap;
    }
  </style>
</head>
<body>
  <div id="hud">
    <div class="left">
      <div class="dot">⬡</div>
      <span class="nm">ARweave</span>
    </div>
    <div id="hint">Point at Hiro marker</div>
  </div>
  <div id="bar">Initialising…</div>

  <!-- debugUIEnabled: true so we see the detection canvas in corner -->
  <a-scene
    embedded
    arjs="sourceType: webcam; debugUIEnabled: true; trackingMethod: best;"
    vr-mode-ui="enabled: false"
    renderer="logarithmicDepthBuffer: true; alpha: true;"
  >
    <a-marker preset="hiro" id="marker">
      <a-box position="0 0.5 0" scale="0.6 0.6 0.6" color="#e11d48"></a-box>
      <a-entity gltf-model="${modelUrl}" scale="${s} ${s} ${s}" position="0 0 0" ${animTag}></a-entity>
    </a-marker>
    <a-entity camera></a-entity>
  </a-scene>

  <script>
    var hint = document.getElementById('hint');
    var bar  = document.getElementById('bar');
    var found = false;

    document.querySelector('a-scene').addEventListener('loaded', function() {
      bar.textContent = 'Ready — point at Hiro marker';
    });

    document.getElementById('marker').addEventListener('markerFound', function() {
      found = true;
      hint.textContent = '✓ Marker found!';
      hint.classList.add('found');
      bar.textContent = 'Tracking marker…';
    });

    document.getElementById('marker').addEventListener('markerLost', function() {
      found = false;
      hint.textContent = 'Point at Hiro marker';
      hint.classList.remove('found');
      bar.textContent = 'Marker lost — keep pointing';
    });

    // Mirror-fix: if front camera detected, mirror the video so Hiro is readable
    var observer = new MutationObserver(function() {
      var video = document.querySelector('video');
      if (video) {
        // Check if this looks like a front camera (MacBook FaceTime / phone selfie)
        navigator.mediaDevices.enumerateDevices().then(function(devices) {
          var cams = devices.filter(function(d){ return d.kind === 'videoinput'; });
          // If only one camera or explicitly front-facing, mirror the video element
          // so the pattern appears correctly to ARToolkit
          if (video.srcObject) {
            var track = video.srcObject.getVideoTracks()[0];
            if (track) {
              var settings = track.getSettings();
              // facingMode 'user' = front camera = mirrored
              if (settings.facingMode === 'user' || cams.length === 1) {
                video.style.transform = 'scaleX(-1)';
                bar.textContent = 'Front camera detected — mirrored for detection';
              }
            }
          }
        });
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
