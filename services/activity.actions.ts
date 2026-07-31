"use server";

import { fetchActivityLogs, recordActivityLog } from "@/services/activity.service";
import type { ActivityType } from "@/types/activity";

export async function getActivityLogsAction() {
  return await fetchActivityLogs();
}

export async function addActivityLogAction(
  userName: string,
  role: "admin" | "kelompok",
  action: ActivityType,
  details: string
) {
  return await recordActivityLog(userName, role, action, details);
}
