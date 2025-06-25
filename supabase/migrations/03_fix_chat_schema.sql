-- Fix chat schema issues
-- 1. Change room_id from UUID to TEXT to support dm_userId1_userId2 pattern
-- 2. Add recipient_id for proper message routing
-- 3. Add read_at for read receipts

-- First, drop any constraints that depend on room_id being UUID
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_room_id_fkey;

-- Change room_id to TEXT
ALTER TABLE public.messages 
ALTER COLUMN room_id TYPE TEXT;

-- Add recipient_id column
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id);

-- Add read_at column
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Update existing messages to populate recipient_id
-- This extracts the recipient from room_id (the userId that isn't the sender)
UPDATE public.messages m
SET recipient_id = 
  CASE 
    WHEN room_id LIKE 'dm_%' THEN
      CASE
        WHEN SPLIT_PART(SUBSTRING(room_id FROM 4), '_', 1) = sender_id::TEXT
        THEN SPLIT_PART(SUBSTRING(room_id FROM 4), '_', 2)::UUID
        ELSE SPLIT_PART(SUBSTRING(room_id FROM 4), '_', 1)::UUID
      END
    ELSE NULL
  END
WHERE recipient_id IS NULL AND room_id LIKE 'dm_%';

-- Add indexes for better query performance (minimal for class project)
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);