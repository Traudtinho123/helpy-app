-- Social-Media Post Bilder (öffentlich für Meta API)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-media-images',
  'social-media-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "social_media_images_select" ON storage.objects;
CREATE POLICY "social_media_images_select"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'social-media-images');

DROP POLICY IF EXISTS "social_media_images_insert" ON storage.objects;
CREATE POLICY "social_media_images_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'social-media-images'
    AND (storage.foldername(name))[1] = public.current_user_company_id()::text
  );

DROP POLICY IF EXISTS "social_media_images_update" ON storage.objects;
CREATE POLICY "social_media_images_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'social-media-images'
    AND (storage.foldername(name))[1] = public.current_user_company_id()::text
  );

DROP POLICY IF EXISTS "social_media_images_delete" ON storage.objects;
CREATE POLICY "social_media_images_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'social-media-images'
    AND (storage.foldername(name))[1] = public.current_user_company_id()::text
  );

NOTIFY pgrst, 'reload schema';
