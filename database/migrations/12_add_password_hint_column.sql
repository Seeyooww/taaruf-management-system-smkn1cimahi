-- Migration 12: Add password_hint column to kelompok table
-- Dijalankan di Supabase SQL Editor
-- Menyimpan password terakhir yang di-set admin agar tampil di dashboard.
-- Default: username (karena password awal = username saat akun dibuat).

ALTER TABLE public.kelompok
  ADD COLUMN IF NOT EXISTS password_hint text;

-- Isi default untuk kelompok yang sudah ada (password awal = username)
UPDATE public.kelompok
  SET password_hint = username
  WHERE password_hint IS NULL;
