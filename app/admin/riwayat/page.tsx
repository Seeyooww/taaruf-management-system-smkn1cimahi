import { getActivityLogsAction } from "@/services/activity.actions";
import { AdminRiwayatView } from "@/components/admin/admin-riwayat-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Riwayat Aktivitas - Admin",
};

export default async function AdminRiwayatPage() {
  const logs = await getActivityLogsAction();

  return <AdminRiwayatView initialLogs={logs} />;
}
