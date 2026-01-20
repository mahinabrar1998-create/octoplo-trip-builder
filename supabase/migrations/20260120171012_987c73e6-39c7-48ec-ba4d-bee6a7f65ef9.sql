-- Create enum for guest responses
CREATE TYPE public.guest_response_type AS ENUM ('going', 'maybe', 'not_going');

-- Create table for trip invites (guests invited to a trip)
CREATE TABLE public.trip_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.published_trips(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    invite_token UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(trip_id, guest_email)
);

-- Create table for guest responses to time blocks
CREATE TABLE public.trip_block_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_id UUID NOT NULL REFERENCES public.trip_invites(id) ON DELETE CASCADE,
    day_index INTEGER NOT NULL,
    block_index INTEGER NOT NULL,
    response guest_response_type NOT NULL DEFAULT 'maybe',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(invite_id, day_index, block_index)
);

-- Enable RLS
ALTER TABLE public.trip_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_block_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can insert invites (trip owner functionality)
CREATE POLICY "Anyone can insert invites"
ON public.trip_invites FOR INSERT
WITH CHECK (true);

-- Anyone can view invites (for guests accessing via token)
CREATE POLICY "Anyone can view invites"
ON public.trip_invites FOR SELECT
USING (true);

-- Anyone can delete invites (trip owner functionality)
CREATE POLICY "Anyone can delete invites"
ON public.trip_invites FOR DELETE
USING (true);

-- Anyone can insert responses (guests responding)
CREATE POLICY "Anyone can insert responses"
ON public.trip_block_responses FOR INSERT
WITH CHECK (true);

-- Anyone can view responses (for trip owner to see)
CREATE POLICY "Anyone can view responses"
ON public.trip_block_responses FOR SELECT
USING (true);

-- Anyone can update responses (guests changing their response)
CREATE POLICY "Anyone can update responses"
ON public.trip_block_responses FOR UPDATE
USING (true);

-- Add DELETE policy to published_trips
CREATE POLICY "Anyone can delete trips"
ON public.published_trips FOR DELETE
USING (true);