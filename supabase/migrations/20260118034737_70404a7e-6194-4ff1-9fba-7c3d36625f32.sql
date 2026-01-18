-- Remove anonymous upload policy from trip-images bucket
DROP POLICY IF EXISTS "Anyone can upload trip images" ON storage.objects;

-- Update the INSERT policy on published_trips to only allow inserts from service role
-- First drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can publish trips" ON public.published_trips;

-- Create a restrictive policy that blocks direct inserts (edge function uses service role which bypasses RLS)
CREATE POLICY "Only service role can insert trips"
ON public.published_trips
FOR INSERT
TO anon, authenticated
WITH CHECK (false);