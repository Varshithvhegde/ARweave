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

// GET /api/experience?slug=xxx — fetch config
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const config = getExperience(slug);
  if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(config);
}
