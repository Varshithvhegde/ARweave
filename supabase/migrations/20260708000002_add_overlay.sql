-- Add overlay support to experiences table
alter table public.experiences
  add column if not exists overlay_type text default 'none'
    check (overlay_type in ('none', 'image', 'video')),
  add column if not exists overlay_url  text;

-- overlay dimensions + position stored in scene_config jsonb (already exists)
-- No new columns needed — scene_config.overlay handles width/height
