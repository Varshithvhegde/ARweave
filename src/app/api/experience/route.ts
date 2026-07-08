import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveExperience, getExperience } from "@/lib/experienceStore";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DUCK = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb";

// POST /api/experience — save config to DB + local file cache
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, name, modelUrl, markerUrl, scale, animation, position, userId } = body;
    const markerImageUrl = body.markerImageUrl ?? null;
    const overlayType    = body.overlayType    ?? "none";
    const overlayUrl     = body.overlayUrl     ?? null;
    const overlayWidth   = Number(body.overlayWidth)  || 1;
    const overlayHeight  = Number(body.overlayHeight) || 0.75;

    if (!slug || !modelUrl) {
      return NextResponse.json({ error: "slug and modelUrl required" }, { status: 400 });
    }

    const sceneConfig = {
      position:       position ?? { x: 0, y: 0, z: 0 },
      markerImageUrl,
      overlay: { type: overlayType, url: overlayUrl, width: overlayWidth, height: overlayHeight },
    };

    const config = {
      slug,
      name:      name || slug,
      modelUrl,
      markerUrl: markerUrl || null,
      scale:     Number(scale) || 1,
      animation: animation || "none",
      sceneConfig,
      createdAt: new Date().toISOString(),
    };

    saveExperience(config);

    if (userId) {
      await supabase.from("experiences").upsert({
        user_id:        userId,
        slug,
        name:           config.name,
        model_url:      modelUrl,
        marker_url:     config.markerUrl,
        scale:          config.scale,
        animation_type: config.animation,
        overlay_type:   overlayType,
        overlay_url:    overlayUrl,
        status:         "published",
        scene_config:   sceneConfig,
      }, { onConflict: "user_id,slug" });
      // Non-fatal — local cache is the fallback
    }

    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    console.error("Save experience error:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// GET /api/experience?slug=xxx — fetch from DB, fall back to local cache
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  // 1. Try Supabase first
  const { data, error } = await supabase
    .from("experiences")
    .select("slug, name, model_url, marker_url, scale, animation_type, scene_config")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!error && data) {
    const sc = (data.scene_config as any) ?? {};
    return NextResponse.json({
      slug:           data.slug,
      name:           data.name,
      modelUrl:       data.model_url,
      markerUrl:      data.marker_url,
      markerImageUrl: sc.markerImageUrl ?? null,
      scale:          Number(data.scale),
      animation:      data.animation_type,
      position:       sc.position    ?? { x: 0, y: 0, z: 0 },
      overlay:        sc.overlay     ?? { type: "none", url: null, width: 1, height: 0.75 },
    });
  }

  // 2. Fall back to local file cache
  let config = getExperience(slug);

  // 3. Seed demo experience
  if (!config && slug === "untitled-experience") {
    config = {
      slug,
      name:      "Demo — Duck on Hiro",
      modelUrl:  DUCK,
      markerUrl: null,
      scale:     1,
      animation: "spin",
      createdAt: new Date().toISOString(),
    };
    saveExperience(config);
  }

  if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(config);
}
