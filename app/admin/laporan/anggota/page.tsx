import { getKelompokAction } from "@/services/kelompok.actions";
import { getLaporanAnggotaAction } from "@/services/reporting.actions";
import { LaporanAnggotaView } from "@/components/admin/reporting/laporan-anggota-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Laporan Anggota - TMS Admin",
};

export default async function AdminLaporanAnggotaPage() {
  const [initialData, kelompokList] = await Promise.all([
    getLaporanAnggotaAction(),
    getKelompokAction(),
  ]);

  return <LaporanAnggotaView initialData={initialData} kelompokList={kelompokList} />;
}
