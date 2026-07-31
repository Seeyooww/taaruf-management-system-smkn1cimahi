import { getKelompokAction } from "@/services/kelompok.actions";
import { getAnggotaProgressAction } from "@/services/progress.actions";
import { AdminProgressView } from "@/components/admin/admin-progress-view";

export const metadata = {
  title: "Monitoring Progress - Admin",
};

export default async function AdminProgressPage() {
  const [progressList, kelompokList] = await Promise.all([
    getAnggotaProgressAction(),
    getKelompokAction(),
  ]);

  return (
    <AdminProgressView
      initialProgressList={progressList}
      kelompokList={kelompokList}
    />
  );
}
