import { AdminBackupView } from "@/components/admin/admin-backup-view";

export const metadata = {
  title: "Backup & Restore - Admin",
};

export default async function AdminBackupPage() {
  return <AdminBackupView />;
}
