import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key — bypasses RLS for server-side uploads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET: Record<string, string> = {
  model:   "models",
  marker:  "markers",
  overlay: "markers", // reuse markers bucket for images/videos
};

const CONTENT_TYPE: Record<string, string> = {
  glb:  "model/gltf-binary",
  gltf: "model/gltf+json",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp4:  "video/mp4",
  webm: "video/webm",
  mov:  "video/quicktime",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "model";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bucket = BUCKET[type] ?? "models";
    const ext    = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path   = `public/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const contentType = CONTENT_TYPE[ext] ?? "application/octet-stream";

    const bytes  = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, {
        contentType,
        upsert: false,
        cacheControl: "31536000", // 1 year CDN cache
      });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
