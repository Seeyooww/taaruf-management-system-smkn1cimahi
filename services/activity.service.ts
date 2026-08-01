import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ActivityLog, ActivityType } from "@/types/activity";

// In-memory fallback for dev mode only (not production)
let mockActivityLogs: ActivityLog[] = [];

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
