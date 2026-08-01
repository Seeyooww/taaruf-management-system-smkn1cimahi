-- ============================================================
-- Migration 05: Activity Logs Table
-- Jalankan di Supabase SQL Editor
-- ============================================================
-- Membuat tabel activity_logs untuk audit trail nyata.
-- Menggantikan implementasi in-memory mock yang tidak persisten.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'kelompok')),
    action text NOT NULL,
    details text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Index untuk query terbaru dan filter role
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_role ON activity_logs(role);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- RLS: hanya admin yang bisa membaca riwayat aktivitas
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: allow service_role (admin backend) to insert and read
CREATE POLICY "service_role_full_access_activity_logs"
  ON activity_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
