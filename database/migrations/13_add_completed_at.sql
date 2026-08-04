-- Migration 13: Add completed_at column to kelompok and anggota tables
-- Used for lock position and completion timestamp tracking

ALTER TABLE public.kelompok 
ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;

ALTER TABLE public.anggota 
ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;
