-- Migration: Trip Photos Storage RLS
-- Date: 2026-03-23
-- Description: Set up RLS policies for the trip-photos storage bucket.
-- NOTE: The bucket must be created in Supabase Dashboard first.
--       Bucket name: trip-photos, Public: true (for read access via public URLs)

-- ============================================================================
-- Storage RLS policies for trip-photos bucket
-- ============================================================================

-- 1. Authenticated users can upload to their own path: trip-photos/{tripId}/{userId}/*
CREATE POLICY "Users can upload their own trip photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 2. Trip members can view all photos in their trip folder.
--    We check that the viewer is a member of the trip (first folder segment = tripId).
CREATE POLICY "Trip members can view trip photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'trip-photos'
  AND EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_members.trip_id = (storage.foldername(name))[1]::uuid
      AND trip_members.user_id = auth.uid()
  )
);

-- 3. Users can delete their own uploads (path contains their userId).
CREATE POLICY "Users can delete their own trip photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'trip-photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
