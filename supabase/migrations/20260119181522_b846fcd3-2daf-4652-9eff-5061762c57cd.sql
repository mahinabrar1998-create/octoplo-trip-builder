-- Update published_trips table to make hero_image_url optional (for simple saves without AI generation)
ALTER TABLE public.published_trips 
  ALTER COLUMN hero_image_url DROP NOT NULL,
  ALTER COLUMN hero_image_url SET DEFAULT '';

-- Add a name column for saved trips
ALTER TABLE public.published_trips 
  ADD COLUMN IF NOT EXISTS name TEXT;