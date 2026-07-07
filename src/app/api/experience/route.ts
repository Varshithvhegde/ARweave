import { NextRequest, NextResponse } from "next/server";
import { saveExperience, getExperience } from "@/lib/experienceStore";

// POST /api/experience — save config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, name, modelUrl, markerUrl, scale, animation } = body;

    if (!slug || !modelUrl) {
      return NextResponse.json({ error: "slug and modelUrl required" }, { status: 400 });
    }

    const config = {
      slug,
      name: name || slug,
      modelUrl,
      markerUrl: markerUrl || null,
      scale: Number(scale) || 1,
      animation: animation || "none",
      createdAt: new Date().toISOString(),
    };

    saveExperience(config);
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    console.error("Save experience error:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

const DUCK_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb";

// GET /api/experience?slug=xxx — fetch config
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  let config = getExperience(slug);

  // Seed a default demo experience so /ar/untitled-experience always works
  if (!config && slug === "untitled-experience") {
    config = {
      slug: "untitled-experience",
      name: "Demo — Duck on Hiro",
      modelUrl: DUCK_URL,
      markerUrl: null,   // null = use Hiro marker
      scale: 1,
      animation: "spin",
      createdAt: new Date().toISOString(),
    };
    saveExperience(config);
  }

  if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(config);
}
