-- Create table for published trips
CREATE TABLE public.published_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  plan JSONB NOT NULL,
  hero_image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.published_trips ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published trips (they are public/shareable)
CREATE POLICY "Published trips are publicly viewable"
ON public.published_trips
FOR SELECT
USING (true);

-- Allow anyone to insert new published trips (no auth required for MVP)
CREATE POLICY "Anyone can publish trips"
ON public.published_trips
FOR INSERT
WITH CHECK (true);