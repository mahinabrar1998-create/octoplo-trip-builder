-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Only service role can insert trips" ON public.published_trips;

-- Create a new policy that allows anyone to insert trips (public save functionality)
CREATE POLICY "Anyone can insert trips" 
ON public.published_trips 
FOR INSERT 
WITH CHECK (true);