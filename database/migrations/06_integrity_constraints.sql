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
-- BUG-09 FIX: Unique constraint pada booking_kating
--
-- MASALAH SEBELUMNYA:
--   Constraint lama (baris di bawah) menggunakan kolom
--   kating_laki_id & kating_perempuan_id yang sudah DEPRECATED
--   sejak Migration 08 (many-to-many via booking_kating).
--   Kolom tersebut bernilai NULL untuk semua booking baru,
--   sehingga constraint TIDAK PERNAH aktif → kating bisa
--   dibooking berkali-kali pada tanggal yang sama di slot berbeda
--   maupun slot yang sama tanpa hambatan apapun.
--
-- SOLUSI:
--   Hapus index lama yang tidak relevan.
--   Penegakan konflik kating kini sepenuhnya dilakukan di
--   application layer (fetchAvailableKating: dua langkah query
--   booking → booking_kating berdasarkan tanggal+slot_id),
--   dan didukung oleh unique constraint (booking_id, kating_id)
--   pada tabel booking_kating (Migration 08 baris 15) yang
--   mencegah kating masuk dua kali dalam satu booking yang sama.
--
-- Kombinasi konflik yang benar: (tanggal, slot_id, kating_id).
-- ─────────────────────────────────────────────────────────────

-- Hapus index lama yang salah (menggunakan kolom deprecated)
DROP INDEX IF EXISTS uq_booking_kating_laki_per_slot;
DROP INDEX IF EXISTS uq_booking_kating_perempuan_per_slot;

-- Tambahan: satu kelompok tidak boleh booking pada tanggal + slot yang sama
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_kelompok_per_slot
  ON booking(kelompok_id, tanggal, slot_id)
  WHERE status NOT IN ('Ditolak', 'Dibatalkan');

