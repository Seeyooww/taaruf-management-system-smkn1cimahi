-- ============================================================
-- Migration 06: Database Integrity Constraints
-- Jalankan di Supabase SQL Editor
-- ============================================================
-- Menambahkan constraint yang missing untuk mencegah:
--   BUG-09: Race condition saat dua kelompok booking kating yang sama
--   BUG-16: Duplicate insert di booking_participants (per booking per anggota)
--   BUG-17: Duplicate progress records (per anggota per kating)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- BUG-16: Unique constraint on booking_participants
-- Satu anggota hanya boleh muncul SATU KALI per booking.
-- Ini mencegah double-submit dari progress confirmation.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE booking_participants
  ADD CONSTRAINT uq_booking_participant_per_booking
  UNIQUE (booking_id, anggota_id)
  DEFERRABLE INITIALLY DEFERRED;

-- ─────────────────────────────────────────────────────────────
-- BUG-17: Unique constraint on progress
-- Satu anggota hanya boleh mendapat satu progress record
-- per kating yang sama (lintas semua booking).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE progress
  ADD CONSTRAINT uq_progress_anggota_kating
  UNIQUE (anggota_id, kating_id)
  DEFERRABLE INITIALLY DEFERRED;

-- ─────────────────────────────────────────────────────────────
-- BUG-09: Unique constraint on booking to prevent race conditions
-- Satu kating laki hanya boleh di-assign sekali per (tanggal, slot)
-- di booking yang aktif (bukan ditolak/dibatalkan).
--
-- Catatan: PostgreSQL partial unique index tidak bisa langsung
-- dikombinasikan dengan status filter di ALTER TABLE, 
-- sehingga kita buat sebagai CREATE UNIQUE INDEX.
-- ─────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_kating_laki_per_slot
  ON booking(tanggal, slot_id, kating_laki_id)
  WHERE status NOT IN ('Ditolak', 'Dibatalkan');

CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_kating_perempuan_per_slot
  ON booking(tanggal, slot_id, kating_perempuan_id)
  WHERE status NOT IN ('Ditolak', 'Dibatalkan');

-- Tambahan: satu kelompok tidak boleh booking pada tanggal + slot yang sama
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_kelompok_per_slot
  ON booking(kelompok_id, tanggal, slot_id)
  WHERE status NOT IN ('Ditolak', 'Dibatalkan');
