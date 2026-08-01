import { getKelompokAction } from "@/services/kelompok.actions";
import { getLaporanKatingAction } from "@/services/reporting.actions";
import { LaporanKatingView } from "@/components/admin/reporting/laporan-kating-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporan Kating - TMS Admin",
};

export default async function AdminLaporanKatingPage() {
  const [initialData, kelompokList] = await Promise.all([
    getLaporanKatingAction(),
    getKelompokAction(),
  ]);

  return <LaporanKatingView initialData={initialData} kelompokList={kelompokList} />;
}
