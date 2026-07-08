import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Receives a compiled .mind file from the browser and stores it
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("mind") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const path  = `public/mind_${Date.now()}.mind`;

    const { error } = await supabase.storage
      .from("markers")
      .upload(path, bytes, {
        contentType: "application/octet-stream",
        upsert: true,
        cacheControl: "31536000",
      });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("markers").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error("mind upload error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
