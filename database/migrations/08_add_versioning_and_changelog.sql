-- =============================================================================
-- Migration 08: Enterprise Versioning & Changelog System
-- Taaruf Management System (TMS)
-- =============================================================================

-- 1. Create system_version table
CREATE TABLE IF NOT EXISTS public.system_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT UNIQUE NOT NULL,
  build TEXT NOT NULL,
  release_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Stable',
  current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create system_changelog table
CREATE TABLE IF NOT EXISTS public.system_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES public.system_version(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('FEATURE', 'IMPROVEMENT', 'BUGFIX', 'SECURITY', 'BREAKING')),
  title TEXT NOT NULL,
  description TEXT,
  important BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_system_version_current ON public.system_version(current);
CREATE INDEX IF NOT EXISTS idx_system_changelog_version ON public.system_changelog(version);
CREATE INDEX IF NOT EXISTS idx_system_changelog_category ON public.system_changelog(category);

-- 4. Enable RLS and Create RLS Policies
ALTER TABLE public.system_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on system_version" ON public.system_version FOR SELECT USING (true);
CREATE POLICY "Allow public select on system_changelog" ON public.system_changelog FOR SELECT USING (true);
CREATE POLICY "Allow admin write on system_version" ON public.system_version FOR ALL USING (true);
CREATE POLICY "Allow admin write on system_changelog" ON public.system_changelog FOR ALL USING (true);

-- 5. Seed Initial Versions and Changelogs
INSERT INTO public.system_version (id, version, build, release_date, status, current, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'v1.4.2', '20260808', '8 Agustus 2026', 'Stable', true, '2026-08-08T08:00:00Z'),
  ('22222222-2222-2222-2222-222222222222', 'v1.4.1', '20260805', '5 Agustus 2026', 'Stable', false, '2026-08-05T08:00:00Z'),
  ('33333333-3333-3333-3333-333333333333', 'v1.4.0', '20260801', '1 Agustus 2026', 'Stable', false, '2026-08-01T08:00:00Z'),
  ('44444444-4444-4444-4444-444444444444', 'v1.3.2', '20260725', '25 Juli 2026', 'Stable', false, '2026-07-25T08:00:00Z'),
  ('55555555-5555-5555-5555-555555555555', 'v1.3.0', '20260715', '15 Juli 2026', 'Stable', false, '2026-07-15T08:00:00Z')
ON CONFLICT (version) DO NOTHING;

-- Seed v1.4.2 Changelogs
INSERT INTO public.system_changelog (version_id, version, category, title, description, important, order_index)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'v1.4.2', 'FEATURE', 'Dashboard Enterprise Command Center', 'Dashboard admin baru dengan situational awareness, status sistem live, dan visual hierarchy modern.', true, 1),
  ('11111111-1111-1111-1111-111111111111', 'v1.4.2', 'FEATURE', 'Insight Hari Ini & Today Summary', 'Panel otomatis yang mengekstrak insight krusial dan ringkasan operasional harian.', false, 2),
  ('11111111-1111-1111-1111-111111111111', 'v1.4.2', 'FEATURE', 'Quick Actions & System Status Bar', 'Akses cepat ke 6 fungsi utama admin dan indikator kesehatan koneksi database/server realtime.', false, 3),
  ('11111111-1111-1111-1111-111111111111', 'v1.4.2', 'IMPROVEMENT', 'Leaderboard & Analytics Response Time', 'Optimasi kueri dan pagination postgrest untuk performa ekstra cepat.', false, 4),
  ('11111111-1111-1111-1111-111111111111', 'v1.4.2', 'BUGFIX', 'Fixed PostgREST 1000-Row Limit on Progress Queries', 'Memperbaiki pemotongan data progress pada tabel > 1000 baris menggunakan chunked range fetching.', true, 5),
  ('11111111-1111-1111-1111-111111111111', 'v1.4.2', 'BUGFIX', 'Fixed Booking Slot Auto-Change on Edit', 'Menghapus fallback `|| slotList[0]` berbahaya dan menjaga immutability slot_id booking.', true, 6),
  ('11111111-1111-1111-1111-111111111111', 'v1.4.2', 'BUGFIX', 'Fixed Completed_at Synchronization', 'Menyingkronkan timestamp kelulusan target kating antara anggota dan kelompok secara akurat.', false, 7)
ON CONFLICT DO NOTHING;

-- Seed v1.4.1 Changelogs
INSERT INTO public.system_changelog (version_id, version, category, title, description, important, order_index)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'v1.4.1', 'FEATURE', 'Fitur Substitusi Anggota Pengganti', 'Memungkinkan anggota luar kelompok menggantikan anggota yang berhalangan hadir secara fleksibel.', true, 1),
  ('22222222-2222-2222-2222-222222222222', 'v1.4.1', 'IMPROVEMENT', 'Multi-Kating Pendamping per Sesi', 'Dukungan hingga 2 kating pendamping dalam satu sesi Taaruf.', false, 2),
  ('22222222-2222-2222-2222-222222222222', 'v1.4.1', 'BUGFIX', 'Penanganan Bentrok Jadwal Rentang Waktu Overlap', 'Memperbaiki deteksi bentrok jam_mulai dan jam_selesai antar slot.', false, 3)
ON CONFLICT DO NOTHING;

-- Seed v1.4.0 Changelogs
INSERT INTO public.system_changelog (version_id, version, category, title, description, important, order_index)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'v1.4.0', 'FEATURE', 'Sistem Peringkat Leaderboard Individu & Kelompok', 'Tampilan visual real-time peringkat kelompok terbaik & individu peserta.', true, 1),
  ('33333333-3333-3333-3333-333333333333', 'v1.4.0', 'SECURITY', 'Perketat Role-Based Authentication & Session Cookies', 'Enkripsi token sesi admin & kelompok berbasis JWT cookie HTTP-Only.', true, 2)
ON CONFLICT DO NOTHING;
