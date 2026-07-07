import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Saves uploaded file to /public/uploads/<filename> so it's served as a static asset
// and accessible from any device on the same ngrok tunnel
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as "model" | "marker";

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Sanitize filename
    const ext = file.name.split(".").pop() ?? (type === "model" ? "glb" : "jpg");
    const safe = `${type}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, safe);

    await writeFile(filePath, buffer);

    // Return the public URL path — works via ngrok since it's a static file
    return NextResponse.json({ url: `/uploads/${safe}` });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
