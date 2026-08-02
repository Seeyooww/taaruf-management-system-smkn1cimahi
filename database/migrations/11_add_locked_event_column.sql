-- Migration 11: Add locked_event column to settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS locked_event boolean NOT NULL DEFAULT false;
