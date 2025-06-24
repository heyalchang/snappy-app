-- ───────────────────────────────
-- Migration: Simplify Messages for Unified Chat
-- Date: 2024-12-24
-- Purpose: Add media support directly to messages table
-- ───────────────────────────────

-- Add new columns to messages table for media support
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'text' CHECK (type IN ('text', 'photo', 'video')),
ADD COLUMN IF NOT EXISTS media_url text;

-- Update table comments to reflect new usage
COMMENT ON TABLE public.messages IS 'All direct communication - text messages, photos, and videos';
COMMENT ON COLUMN public.messages.type IS 'Message type: text, photo, or video';
COMMENT ON COLUMN public.messages.content IS 'Text content for text messages, optional caption for media messages';
COMMENT ON COLUMN public.messages.media_url IS 'Supabase Storage URL for photo/video messages';
COMMENT ON COLUMN public.messages.room_id IS 'Room identifier - format: dm_user1_user2 for DMs, group_uuid for groups';

-- Update posts table comment to clarify it's for stories only
COMMENT ON TABLE public.posts IS 'Stories only - photos/videos shared to all friends (no expiration for demo)';

-- Note: In production, we would add indexes for performance
-- CREATE INDEX idx_messages_room_id ON public.messages(room_id);
-- CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);