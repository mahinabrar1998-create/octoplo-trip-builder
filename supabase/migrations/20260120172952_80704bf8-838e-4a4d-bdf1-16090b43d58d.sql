-- Add DELETE policy for trip_block_responses so guests can save updated responses
CREATE POLICY "Anyone can delete responses"
ON public.trip_block_responses
FOR DELETE
USING (true);