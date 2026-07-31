export type ActivityType =
  | "Login"
  | "Booking Dibuat"
  | "Booking Disetujui"
  | "Booking Dibatalkan"
  | "Progress Dihitung"
  | "Pengaturan Diubah"
  | "Import Data";

export interface ActivityLog {
  id: string;
  user_name: string;
  role: "admin" | "kelompok";
  action: ActivityType;
  details: string;
  created_at: string;
}
