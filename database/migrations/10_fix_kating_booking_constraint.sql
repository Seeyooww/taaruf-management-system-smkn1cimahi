-- ============================================================
-- Migration 10: Fix Kating Booking Constraint
-- Jalankan di Supabase SQL Editor SETELAH migration 06 & 08
-- ============================================================
-- TUJUAN:
--   Memperbaiki bug di mana satu kating bisa di-booking lebih
--   dari sekali pada tanggal yang sama, ASALKAN slot berbeda,
--   karena constraint lama hanya pada kolom deprecated
--   (kating_laki_id / kating_perempuan_id) yang selalu NULL
--   di booking baru (model many-to-many via booking_kating).
--
-- ROOT CAUSE:
--   Migration 06 membuat UNIQUE INDEX pada:
--     booking(tanggal, slot_id, kating_laki_id)
--     booking(tanggal, slot_id, kating_perempuan_id)
--   Kolom kating_laki_id & kating_perempuan_id tidak pernah
--   diisi di booking baru (sejak Migration 08), sehingga
--   constraint ini tidak pernah aktif.
--
-- SOLUSI DB-LEVEL:
--   Buat function + trigger yang memblokir INSERT/UPDATE ke
--   booking_kating jika kating_id sudah ada di booking aktif
--   lain dengan tanggal dan slot_id yang sama.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Hapus index lama yang salah (jika belum dihapus di migration 06)
-- ─────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS uq_booking_kating_laki_per_slot;
DROP INDEX IF EXISTS uq_booking_kating_perempuan_per_slot;

-- ─────────────────────────────────────────────────────────────
-- Fungsi trigger: cegah kating konflik di slot yang sama
-- Konflik = kating_id yang sama, tanggal yang sama, slot_id yang sama,
--           dan status booking bukan 'Ditolak' atau 'Dibatalkan'.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_kating_slot_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM public.booking_kating bk
  JOIN public.booking b ON b.id = bk.booking_id
  WHERE bk.kating_id = NEW.kating_id
    AND bk.booking_id <> NEW.booking_id
    AND b.status NOT IN ('Ditolak', 'Dibatalkan')
    AND b.tanggal = (
      SELECT tanggal FROM public.booking WHERE id = NEW.booking_id
    )
    AND b.slot_id = (
      SELECT slot_id FROM public.booking WHERE id = NEW.booking_id
    );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION
      'Kating (id: %) sudah dibooking pada tanggal dan slot yang sama oleh booking lain.',
      NEW.kating_id
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- Pasang trigger pada booking_kating
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_check_kating_slot_conflict ON public.booking_kating;

CREATE TRIGGER trg_check_kating_slot_conflict
  BEFORE INSERT OR UPDATE ON public.booking_kating
  FOR EACH ROW
  EXECUTE FUNCTION public.check_kating_slot_conflict();

-- ─────────────────────────────────────────────────────────────
-- Pastikan constraint kelompok per slot masih ada
-- ─────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_kelompok_per_slot
  ON public.booking(kelompok_id, tanggal, slot_id)
  WHERE status NOT IN ('Ditolak', 'Dibatalkan');
