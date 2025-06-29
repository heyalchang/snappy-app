-- ───────────────────────────────────────────────────────────────
-- Migration: Enable Realtime for friendships table
-- File: 03_enable_friendships_realtime.sql
-- Purpose: Ensure INSERT/UPDATE/DELETE events on public.friendships
--          are broadcast to clients via supabase_realtime.
-- Created: 2025-06-29
-- ───────────────────────────────────────────────────────────────

alter publication supabase_realtime
add table public.friendships;