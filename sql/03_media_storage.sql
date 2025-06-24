-- ───────────────────────────────
-- Migration: Media Storage Setup
-- Date: 2024-12-24
-- Purpose: Create media storage bucket and policies
-- ───────────────────────────────

-- Create media bucket if it doesn't exist (public bucket for easy access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for media bucket
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow everyone to view media (public bucket)
CREATE POLICY "Public can view media" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow users to delete their own media
CREATE POLICY "Users can delete own media" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND owner = auth.uid());