-- ============================================================
-- Migration 07: Add jam_pulang to booking table
-- Jalankan di Supabase SQL Editor
-- ============================================================
-- Kolom jam_pulang menyimpan estimasi jam pulang kelompok secara fleksibel
-- menggunakan Time Picker, independen dari Slot Waktu kating.
-- ============================================================

ALTER TABLE public.booking
  ADD COLUMN IF NOT EXISTS jam_pulang text NULL;

CREATE INDEX IF NOT EXISTS idx_booking_jam_pulang ON public.booking(jam_pulang);
