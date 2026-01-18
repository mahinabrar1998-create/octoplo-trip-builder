-- Create storage bucket for trip images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trip-images', 'trip-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to trip images
CREATE POLICY "Trip images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'trip-images');

-- Allow anyone to upload trip images (for edge functions)
CREATE POLICY "Anyone can upload trip images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'trip-images');

-- Add theme_colors column to published_trips for destination theming
ALTER TABLE public.published_trips 
ADD COLUMN IF NOT EXISTS theme_colors JSONB DEFAULT '{}';
