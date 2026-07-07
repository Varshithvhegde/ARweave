import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveExperience } from "@/lib/experienceStore";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateSlug() {
  const adjectives = ["bold", "bright", "calm", "cool", "crisp", "epic", "fast", "keen", "neat", "pure", "swift", "vivid"];
  const nouns      = ["arc", "beam", "burst", "cube", "dart", "echo", "flash", "glow", "halo", "lens", "orb", "prism", "ray", "spark", "wave"];
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num  = Math.floor(Math.random() * 900) + 100;
  return `${adj}-${noun}-${num}`;
}

// POST /api/experience/create — create a blank experience and return its slug
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId ?? null;
    const name   = body.name ?? "Untitled experience";

    let slug = generateSlug();

    const config = {
      slug,
      name,
      modelUrl:  "",
      markerUrl: null,
      scale:     1,
      animation: "none",
      createdAt: new Date().toISOString(),
    };

    // Save to local cache immediately
    saveExperience(config);

    // Save to Supabase if logged in
    if (userId) {
      // Ensure slug is unique per user — retry up to 3 times
      let attempts = 0;
      while (attempts < 3) {
        const { error } = await supabase.from("experiences").insert({
          user_id:        userId,
          slug,
          name,
          model_url:      null,
          marker_url:     null,
          scale:          1,
          animation_type: "none",
          status:         "draft",
          scene_config:   {},
        });
        if (!error) break;
        // Slug collision — regenerate
        slug = generateSlug();
        config.slug = slug;
        attempts++;
      }
    }

    return NextResponse.json({ slug, name });
  } catch (e) {
    console.error("Create experience error:", e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
