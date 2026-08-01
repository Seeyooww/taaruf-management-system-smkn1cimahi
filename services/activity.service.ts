import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ActivityLog, ActivityType } from "@/types/activity";

// In-memory fallback for dev mode only (not production)
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
];

export async function recordActivityLog(
  userName: string,
  role: "admin" | "kelompok",
  action: ActivityType,
  details: string
) {
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();
      const { data, error } = await adminClient
        .from("activity_logs")
        .insert({
          user_name: userName,
          role,
          action,
          details,
        })
        .select()
        .single();

      if (error) {
        // Non-fatal: log but don't break the calling operation
        console.error("[recordActivityLog] insert error:", error.message);
        return null;
      }

      return data as ActivityLog;
    } catch (err) {
      console.error("[recordActivityLog] unexpected error:", err);
      return null;
    }
  }

  // Dev mode: in-memory
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
  if (isSupabaseConfigured()) {
    try {
      const adminClient = createSupabaseAdminClient();
      const { data, error } = await adminClient
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("[fetchActivityLogs] error:", error.message);
        return [];
      }

      return (data ?? []) as ActivityLog[];
    } catch (err) {
      console.error("[fetchActivityLogs] unexpected error:", err);
      return [];
    }
  }

  // Dev mode: return in-memory sorted
  return [...mockActivityLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
