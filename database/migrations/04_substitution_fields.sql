-- ============================================================
-- Migration 04: Substitution Fields on booking_participants
-- Jalankan di Supabase SQL Editor
-- ============================================================
-- Tambah 2 kolom ke booking_participants:
--   is_substitute        -> true jika peserta ini adalah pengganti dari kelompok lain
--   replaces_anggota_id  -> ID anggota asli yang digantikan (nullable)
-- ============================================================

ALTER TABLE booking_participants
  ADD COLUMN IF NOT EXISTS is_substitute       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replaces_anggota_id uuid    REFERENCES public.anggota(id) ON DELETE SET NULL;

-- Index untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_bp_is_substitute      ON booking_participants(is_substitute);
CREATE INDEX IF NOT EXISTS idx_bp_replaces_anggota   ON booking_participants(replaces_anggota_id);
