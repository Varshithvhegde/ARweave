-- ─── STORAGE BUCKETS ────────────────────────────────────────

-- GLB/GLTF 3D model files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'models',
  'models',
  true,
  52428800, -- 50MB per file
  array['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
) on conflict (id) do nothing;

-- Marker images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'markers',
  'markers',
  true,
  10485760, -- 10MB per file
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do nothing;

-- ─── STORAGE RLS POLICIES ───────────────────────────────────

-- Models bucket: owner upload/delete, public read
create policy "models_public_read" on storage.objects
  for select using (bucket_id = 'models');

create policy "models_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'models' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "models_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'models' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Markers bucket: owner upload/delete, public read
create policy "markers_public_read" on storage.objects
  for select using (bucket_id = 'markers');

create policy "markers_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'markers' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "markers_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'markers' and auth.uid()::text = (storage.foldername(name))[1]
  );
