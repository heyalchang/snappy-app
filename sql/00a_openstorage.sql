-- Create media bucket if it doesn't exist (public bucket for easy access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for media bucket
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

  -- Allow authenticated users to view their uploads
  CREATE POLICY "Authenticated users can view" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media');

  -- Allow public to view all files (for sharing)
  CREATE POLICY "Public can view all" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'media');