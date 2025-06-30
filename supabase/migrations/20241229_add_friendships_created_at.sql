-- Add created_at column to friendships table for request tracking
ALTER TABLE public.friendships 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Update existing rows to have a created_at value
UPDATE public.friendships 
SET created_at = now() 
WHERE created_at IS NULL;

-- Add index for performance when querying by date
CREATE INDEX IF NOT EXISTS idx_friendships_created_at 
ON public.friendships(created_at DESC);

-- Add index for efficiently finding pending requests
CREATE INDEX IF NOT EXISTS idx_friendships_status_friend 
ON public.friendships(friend_id, status);