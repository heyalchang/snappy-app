-- Add missing columns to messages table for message types and media
-- These columns are required by the chat service

-- Add type column for message type (text, photo, video)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';

-- Add media_url column for photo/video messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Add check constraint for valid message types
ALTER TABLE public.messages 
ADD CONSTRAINT messages_type_check 
CHECK (type IN ('text', 'photo', 'video'));

-- Update existing messages to have type='text' if they have content
UPDATE public.messages 
SET type = 'text' 
WHERE type IS NULL AND content IS NOT NULL;

-- Create index on type for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(type);