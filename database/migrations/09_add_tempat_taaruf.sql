-- ============================================================
-- Migration 09: Add tempat_taaruf column to booking table
-- ============================================================

ALTER TABLE public.booking
ADD COLUMN IF NOT EXISTS tempat_taaruf text;
