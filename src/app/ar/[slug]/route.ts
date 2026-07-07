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

  const { data } = await supabase
    .from("experiences")
    .select("name, model_url, marker_url, scale, animation_type")
    .eq("slug", slug)
    .single();

  if (data) {
    name      = data.name ?? slug;
    modelUrl  = data.model_url;
    markerUrl = data.marker_url;
    scale     = Number(data.scale) || 1;
    animation = data.animation_type ?? "spin";
  } else {
    // 2. Fall back to local file cache
    const cached = getExperience(slug);
    if (cached) {
      name      = cached.name;
      modelUrl  = cached.modelUrl || null;
      markerUrl = cached.markerUrl;
      scale     = Number(cached.scale) || 1;
      animation = cached.animation ?? "spin";
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
    <div id="hint">${markerUrl ? "Point at your marker" : "Point at Hiro marker"}</div>
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

    <a-marker preset="${markerUrl ? "custom" : "hiro"}" ${markerUrl ? `url="${markerUrl}"` : ""} id="marker">
      <a-entity
        gltf-model="#model"
        scale="${s} ${s} ${s}"
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
      bar.textContent = '${markerUrl ? "Point at your marker image" : "Point at the Hiro marker"}';
    });

    document.querySelector('a-assets').addEventListener('loaded', function() {
      bar.textContent = 'Model ready · ${markerUrl ? "Point at marker" : "Point at Hiro marker"}';
    });

    document.getElementById('marker').addEventListener('markerFound', function() {
      hint.textContent = '✓ Tracking';
      hint.classList.add('found');
      bar.textContent = 'AR active';
    });

    document.getElementById('marker').addEventListener('markerLost', function() {
      hint.textContent = '${markerUrl ? "Point at your marker" : "Point at Hiro marker"}';
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

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
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
