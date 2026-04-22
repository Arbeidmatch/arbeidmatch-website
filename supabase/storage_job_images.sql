-- Public bucket for employer job photos. Safe to run multiple times.
-- Uploads use the service role from API routes (bypasses Storage RLS).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-images',
  'job-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read job-images" on storage.objects;
create policy "Public read job-images"
on storage.objects
for select
using (bucket_id = 'job-images');
