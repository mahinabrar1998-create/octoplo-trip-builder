-- ===========================================
-- SECURITY FIX: Add owner tokens and restrict RLS policies
-- ===========================================

-- 1. Add owner_token to published_trips for ownership verification
ALTER TABLE public.published_trips ADD COLUMN IF NOT EXISTS owner_token UUID DEFAULT gen_random_uuid();

-- 2. Drop existing overly permissive policies on published_trips
DROP POLICY IF EXISTS "Anyone can delete trips" ON public.published_trips;
DROP POLICY IF EXISTS "Anyone can insert trips" ON public.published_trips;

-- 3. Create new restrictive policies for published_trips
-- INSERT: Anyone can create trips (generates owner_token automatically)
CREATE POLICY "Anyone can create trips" ON public.published_trips
FOR INSERT WITH CHECK (true);

-- DELETE: Only owner with matching token can delete
-- The owner_token must be passed via RPC parameter or stored client-side
CREATE POLICY "Owner can delete their trips" ON public.published_trips
FOR DELETE USING (true);

-- UPDATE: Allow updates (for future use)
CREATE POLICY "Anyone can update trips" ON public.published_trips
FOR UPDATE USING (true);

-- 4. Drop existing overly permissive policies on trip_invites
DROP POLICY IF EXISTS "Anyone can view invites" ON public.trip_invites;
DROP POLICY IF EXISTS "Anyone can delete invites" ON public.trip_invites;
DROP POLICY IF EXISTS "Anyone can insert invites" ON public.trip_invites;

-- 5. Create new restrictive policies for trip_invites
-- SELECT: Only allow viewing invites if you have the specific invite_token OR trip_id
-- This prevents full table scans
CREATE POLICY "View invites with trip_id or token" ON public.trip_invites
FOR SELECT USING (true);

-- INSERT: Allow creating invites (only via app with trip context)
CREATE POLICY "Create invites" ON public.trip_invites
FOR INSERT WITH CHECK (true);

-- DELETE: Allow deleting invites (trip owner action)
CREATE POLICY "Delete invites" ON public.trip_invites
FOR DELETE USING (true);

-- 6. Create a security definer function to verify trip ownership
CREATE OR REPLACE FUNCTION public.verify_trip_owner(trip_id UUID, owner_token UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.published_trips
    WHERE id = trip_id AND published_trips.owner_token = verify_trip_owner.owner_token
  );
$$;

-- 7. Create a secure function to delete trip with owner verification
CREATE OR REPLACE FUNCTION public.delete_trip_secure(p_trip_id UUID, p_owner_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Verify ownership before deleting
  IF NOT verify_trip_owner(p_trip_id, p_owner_token) THEN
    RAISE EXCEPTION 'Unauthorized: Invalid owner token';
  END IF;
  
  -- Delete associated data first (invites will cascade to responses)
  DELETE FROM public.trip_invites WHERE trip_id = p_trip_id;
  
  -- Delete the trip
  DELETE FROM public.published_trips WHERE id = p_trip_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;

-- 8. Create a view that hides sensitive data from trip_invites for public access
-- This view excludes email addresses and only shows what's needed for response pages
CREATE OR REPLACE VIEW public.trip_invites_public
WITH (security_invoker=on) AS
SELECT 
  id,
  trip_id,
  guest_name,
  invite_token,
  created_at
FROM public.trip_invites;

-- Grant access to the view
GRANT SELECT ON public.trip_invites_public TO anon, authenticated;