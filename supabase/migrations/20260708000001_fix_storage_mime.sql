-- Allow .mind files (application/octet-stream) in markers bucket
-- and models bucket (some GLBs come through as octet-stream too)
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/octet-stream'
]
where id = 'markers';

update storage.buckets
set allowed_mime_types = array[
  'model/gltf-binary', 'model/gltf+json',
  'application/octet-stream'
]
where id = 'models';
