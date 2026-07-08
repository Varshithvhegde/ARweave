import { NextRequest, NextResponse } from "next/server";
import { getExperience } from "@/lib/experienceStore";
import { createClient } from "@supabase/supabase-js";

const DUCK   = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb";
const AFRAME = "https://aframe.io/releases/1.3.0/aframe.min.js";
const ARJS   = "https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. Try Supabase DB
  let modelUrl: string | null = null;
  let markerUrl: string | null = null;
  let scale = 1;
  let animation = "spin";
  let name = slug;
  let position = { x: 0, y: 0, z: 0 };
  let overlay: { type: string; url: string | null; width: number; height: number } = { type: "none", url: null, width: 1, height: 0.75 };

  const { data } = await supabase
    .from("experiences")
    .select("name, model_url, marker_url, scale, animation_type, scene_config")
    .eq("slug", slug)
    .single();

  if (data) {
    name      = data.name ?? slug;
    modelUrl  = data.model_url;
    markerUrl = data.marker_url;
    scale     = Number(data.scale) || 1;
    animation = data.animation_type ?? "spin";
    const sc  = ((data as any).scene_config as any) ?? {};
    position  = sc.position ?? { x: 0, y: 0, z: 0 };
    if (sc.overlay?.url) overlay = sc.overlay;
  } else {
    // 2. Fall back to local file cache
    const cached = getExperience(slug);
    if (cached) {
      name      = cached.name;
      modelUrl  = cached.modelUrl || null;
      markerUrl = cached.markerUrl;
      scale     = Number(cached.scale) || 1;
      animation = cached.animation ?? "spin";
      position  = cached.sceneConfig?.position ?? { x: 0, y: 0, z: 0 };
      if ((cached.sceneConfig as any)?.overlay?.url) overlay = (cached.sceneConfig as any).overlay;
    }
  }

  // 3. Seed demo
  if (!modelUrl && slug === "untitled-experience") {
    modelUrl  = DUCK;
    markerUrl = null;
    scale     = 1;
    animation = "spin";
    name      = "Demo — Duck on Hiro";
  }

  if (!modelUrl) {
    return new NextResponse(notFoundHtml(slug), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  const s = scale;
  const isMind = markerUrl?.endsWith(".mind") ?? false;

  const animAttr = animation === "spin"
    ? `property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear`
    : animation === "float"
    ? `property: position; from: 0 0.5 0; to: 0 0.8 0; dir: alternate; loop: true; dur: 1500; easing: easeInOutSine`
    : animation === "pulse"
    ? `property: scale; from: ${s*0.9} ${s*0.9} ${s*0.9}; to: ${s*1.1} ${s*1.1} ${s*1.1}; dir: alternate; loop: true; dur: 900`
    : "";
  const animTag = animAttr ? `animation="${animAttr}"` : "";

  // Use MindAR for .mind files, AR.js for Hiro
  const html = isMind
    ? buildMindARHtml({ name, modelUrl, markerUrl: markerUrl!, scale, animTag, position, overlay })
    : buildARJsHtml({ name, modelUrl, scale: s, animTag });

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function buildMindARHtml({ name, modelUrl, markerUrl, scale, animTag, position, overlay }: {
  name: string; modelUrl: string; markerUrl: string; scale: number; animTag: string;
  position: { x: number; y: number; z: number };
  overlay: { type: string; url: string | null; width: number; height: number };
}) {
  // Builder: marker plane = 2 Three.js units wide
  // MindAR:  marker = 1 unit wide
  // → divide scale and position by 2 to preserve visual ratio
  const s  = (scale    / 2).toFixed(4);
  const px = (position.x / 2).toFixed(4);
  const py = (position.y / 2).toFixed(4);
  const pz = (position.z / 2).toFixed(4);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <title>${name} · ARweave</title>
  <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
  <style>
    * { margin:0; padding:0; }
    body { overflow: hidden; }
    #hud {
      position:fixed; top:0; left:0; right:0; z-index:9999;
      pointer-events:none; padding:10px 14px;
      background:linear-gradient(to bottom,rgba(0,0,0,0.6),transparent);
      display:flex; align-items:center; justify-content:space-between;
      font-family:-apple-system,sans-serif;
    }
    .left { display:flex; align-items:center; gap:8px; }
    .dot  { width:26px; height:26px; border-radius:8px; background:linear-gradient(135deg,#7c3aed,#a855f7); display:flex; align-items:center; justify-content:center; font-size:12px; }
    .nm   { color:#fff; font-size:13px; font-weight:700; }
    #hint {
      font-family:-apple-system,sans-serif; font-size:11px; font-weight:600;
      color:#fff; background:rgba(255,255,255,0.18);
      backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
      border-radius:20px; padding:4px 12px; transition:background 0.3s;
    }
    #hint.found { background:rgba(5,150,105,0.85); }
    #bar {
      position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
      z-index:9999; font-family:-apple-system,sans-serif; font-size:11px;
      color:rgba(255,255,255,0.85); background:rgba(0,0,0,0.55);
      backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
      border-radius:20px; padding:5px 14px; white-space:nowrap;
    }
  </style>
</head>
<body>
  <div id="hud">
    <div class="left"><div class="dot">⬡</div><span class="nm">${name}</span></div>
    <div id="hint">Point at your image</div>
  </div>
  <div id="bar">Loading AR…</div>

  <a-scene
    mindar-image="imageTargetSrc: ${markerUrl}; autoStart: true; uiLoading: no; uiScanning: no; uiError: no; filterMinCF: 0.001; filterBeta: 0.01; missTolerance: 5; warmupTolerance: 5;"
    color-space="sRGB"
    renderer="colorManagement: true; physicallyCorrectLights: true;"
    vr-mode-ui="enabled: false"
    device-orientation-permission-ui="enabled: false"
  >
    <a-assets timeout="30000">
      <a-asset-item id="model" src="${modelUrl}"></a-asset-item>
      ${overlay.type === "video" && overlay.url
        ? `<video id="overlay-vid" src="${overlay.url}" autoplay loop muted playsinline crossorigin="anonymous"></video>`
        : ""}
    </a-assets>

    <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

    <a-entity mindar-image-target="targetIndex: 0" id="target">
      <!-- 3D model -->
      <a-entity
        gltf-model="#model"
        position="${px} ${py} ${pz}"
        scale="${s} ${s} ${s}"
        rotation="0 0 0"
        ${animTag}
      ></a-entity>

      ${overlay.type === "image" && overlay.url
        ? `<!-- 2D image overlay -->
      <a-image
        src="${overlay.url}"
        width="${overlay.width}"
        height="${overlay.height}"
        position="0 0 0.001"
        rotation="0 0 0"
      ></a-image>`
        : ""}

      ${overlay.type === "video" && overlay.url
        ? `<!-- Video overlay -->
      <a-video
        src="#overlay-vid"
        width="${overlay.width}"
        height="${overlay.height}"
        position="0 0 0.001"
        rotation="0 0 0"
      ></a-video>`
        : ""}
    </a-entity>
  </a-scene>

  <script>
    var hint   = document.getElementById('hint');
    var bar    = document.getElementById('bar');
    var target = document.getElementById('target');
    var scene  = document.querySelector('a-scene');

    scene.addEventListener('loaded', function() {
      bar.textContent = 'Point at your marker image';
    });

    // MindAR fires targetFound/targetLost on the mindar-image-target entity
    target.addEventListener('targetFound', function() {
      hint.textContent = '✓ Tracking';
      hint.classList.add('found');
      bar.textContent = 'AR active';
    });
    target.addEventListener('targetLost', function() {
      hint.textContent = 'Point at your image';
      hint.classList.remove('found');
      bar.textContent = 'Searching for marker…';
    });

    // iOS keep video alive
    document.addEventListener('touchend', function() {
      var v = document.querySelector('video');
      if (v && v.paused) v.play().catch(function(){});
    });
  </script>
</body>
</html>`;
}

function buildARJsHtml({ name, modelUrl, scale, animTag }: {
  name: string; modelUrl: string; scale: number; animTag: string;
}) {
  const AFRAME = "https://aframe.io/releases/1.3.0/aframe.min.js";
  const ARJS   = "https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <title>${name} · ARweave</title>
  <script src="${AFRAME}"></script>
  <script src="${ARJS}"></script>
  <style>
    body { margin: 0; overflow: hidden; background: #000; }
    #hud {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      pointer-events: none; padding: 10px 14px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
      display: flex; align-items: center; justify-content: space-between;
      font-family: -apple-system, sans-serif;
    }
    .left { display:flex; align-items:center; gap:8px; }
    .dot  { width:26px; height:26px; border-radius:8px; background:linear-gradient(135deg,#7c3aed,#a855f7); display:flex; align-items:center; justify-content:center; font-size:12px; }
    .nm   { color:#fff; font-size:13px; font-weight:700; }
    #hint {
      font-family:-apple-system,sans-serif; font-size:11px; font-weight:600;
      color:#fff; background:rgba(255,255,255,0.18);
      backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
      border-radius:20px; padding:4px 12px; transition:background 0.3s;
    }
    #hint.found { background:rgba(5,150,105,0.85); }
    #bar {
      position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
      z-index:9999; font-family:-apple-system,sans-serif; font-size:11px;
      color:rgba(255,255,255,0.85); background:rgba(0,0,0,0.55);
      backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
      border-radius:20px; padding:5px 14px; white-space:nowrap;
    }
  </style>
</head>
<body>
  <div id="hud">
    <div class="left">
      <div class="dot">⬡</div>
      <span class="nm">${name}</span>
    </div>
    <div id="hint">Point at Hiro marker</div>
  </div>
  <div id="bar">Loading…</div>

  <a-scene
    embedded
    arjs="sourceType: webcam; debugUIEnabled: false; trackingMethod: best;"
    vr-mode-ui="enabled: false"
    renderer="logarithmicDepthBuffer: true; alpha: true;"
  >
    <a-assets timeout="30000">
      <a-asset-item id="model" src="${modelUrl}"></a-asset-item>
    </a-assets>

    <a-marker preset="hiro" id="marker">
      <a-entity
        gltf-model="#model"
        scale="${scale} ${scale} ${scale}"
        position="0 0.5 0"
        ${animTag}
      ></a-entity>
    </a-marker>

    <a-entity camera></a-entity>
  </a-scene>

  <script>
    var hint = document.getElementById('hint');
    var bar  = document.getElementById('bar');

    document.querySelector('a-scene').addEventListener('loaded', function() {
      bar.textContent = 'Point at the Hiro marker';
    });
    document.querySelector('a-assets').addEventListener('loaded', function() {
      bar.textContent = 'Model ready · Point at Hiro marker';
    });
    document.getElementById('marker').addEventListener('markerFound', function() {
      hint.textContent = '✓ Tracking'; hint.classList.add('found'); bar.textContent = 'AR active';
    });
    document.getElementById('marker').addEventListener('markerLost', function() {
      hint.textContent = 'Point at Hiro marker'; hint.classList.remove('found'); bar.textContent = 'Searching…';
    });
    document.addEventListener('touchend', function() {
      var v = document.querySelector('video');
      if (v && v.paused) v.play().catch(function(){});
    });
  </script>
</body>
</html>`;
  return html;
}

function notFoundHtml(slug: string) {
  return `<!DOCTYPE html><html><body style="background:#08080f;color:#fff;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center">
    <div>
      <div style="font-size:48px;margin-bottom:16px">⬡</div>
      <h2 style="margin-bottom:8px;font-size:20px">Experience not found</h2>
      <p style="color:#555;margin-bottom:20px;font-size:13px">/${slug}</p>
      <a href="/" style="color:#a78bfa;text-decoration:none;border:1px solid #a78bfa;padding:8px 20px;border-radius:8px;font-size:13px">Go home</a>
    </div>
  </body></html>`;
}
