import "server-only";

import type { ActivityLog, ActivityType } from "@/types/activity";

let mockActivityLogs: ActivityLog[] = [
  {
    id: "log-1",
    user_name: "Admin TMS",
    role: "admin",
    action: "Login",
    details: "Admin berhasil masuk ke sistem.",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "log-2",
    user_name: "Kelompok 1",
    role: "kelompok",
    action: "Booking Dibuat",
    details: "Membuat booking sesi Taaruf untuk slot Istirahat 2 (2026-08-03).",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "log-3",
    user_name: "Admin TMS",
    role: "admin",
    action: "Booking Disetujui",
    details: "Menyetujui booking Kelompok 1 pada slot Istirahat 2.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "log-4",
    user_name: "Admin TMS",
    role: "admin",
    action: "Progress Dihitung",
    details: "Menghitung presensi & progress untuk 4 anggota Kelompok 1 (+2 progress).",
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export async function recordActivityLog(
  userName: string,
  role: "admin" | "kelompok",
  action: ActivityType,
  details: string
) {
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random()}`,
    user_name: userName,
    role,
    action,
    details,
    created_at: new Date().toISOString(),
  };

  mockActivityLogs.unshift(newLog);
  return newLog;
}

export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  return [...mockActivityLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
