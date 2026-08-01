import { getKelompokAction } from "@/services/kelompok.actions";
import { getLaporanKelompokAction } from "@/services/reporting.actions";
import { LaporanKelompokView } from "@/components/admin/reporting/laporan-kelompok-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporan Kelompok - TMS Admin",
};

export default async function AdminLaporanKelompokPage() {
  const [initialData, kelompokList] = await Promise.all([
    getLaporanKelompokAction(),
    getKelompokAction(),
  ]);

  return <LaporanKelompokView initialData={initialData} kelompokList={kelompokList} />;
}
