-- ============================================================
-- Migration 08: booking_kating Many-to-Many Relation
-- Backward-compatible: kolom kating_laki_id & kating_perempuan_id
-- di tabel booking TIDAK dihapus. Akan di-drop di migration 09
-- setelah verifikasi deploy.
-- ============================================================

-- 1. Buat tabel relasi booking_kating
CREATE TABLE IF NOT EXISTS public.booking_kating (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.booking(id) ON DELETE CASCADE,
  kating_id uuid NOT NULL REFERENCES public.kating(id),
  contacted boolean NOT NULL DEFAULT false,
  contacted_at text,
  UNIQUE(booking_id, kating_id)
);

-- 2. Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_booking_kating_booking ON public.booking_kating(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_kating_kating ON public.booking_kating(kating_id);

-- 3. Backfill: migrasikan kating_laki_id -> booking_kating
INSERT INTO public.booking_kating (booking_id, kating_id)
SELECT id, kating_laki_id
FROM public.booking
WHERE kating_laki_id IS NOT NULL
ON CONFLICT (booking_id, kating_id) DO NOTHING;

-- 4. Backfill: migrasikan kating_perempuan_id -> booking_kating
INSERT INTO public.booking_kating (booking_id, kating_id)
SELECT id, kating_perempuan_id
FROM public.booking
WHERE kating_perempuan_id IS NOT NULL
ON CONFLICT (booking_id, kating_id) DO NOTHING;

-- 5. Backfill contacted status dari booking (akang_contacted)
UPDATE public.booking_kating bk
SET contacted = true,
    contacted_at = b.akang_contacted_at
FROM public.booking b
WHERE bk.booking_id = b.id
  AND bk.kating_id = b.kating_laki_id
  AND b.akang_contacted = true;

-- 6. Backfill contacted status dari booking (teteh_contacted)
UPDATE public.booking_kating bk
SET contacted = true,
    contacted_at = b.teteh_contacted_at
FROM public.booking b
WHERE bk.booking_id = b.id
  AND bk.kating_id = b.kating_perempuan_id
  AND b.teteh_contacted = true;

-- NOTE: Kolom lama (kating_laki_id, kating_perempuan_id, akang_contacted,
-- akang_contacted_at, teteh_contacted, teteh_contacted_at) dipertahankan
-- untuk backward-compat. Drop akan dilakukan di migration 09.
