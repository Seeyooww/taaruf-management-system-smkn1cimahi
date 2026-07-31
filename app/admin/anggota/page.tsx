import { getAnggotaAction } from "@/services/anggota.actions";
import { getKelompokAction } from "@/services/kelompok.actions";
import { AnggotaView } from "@/components/admin/anggota-view";

export const metadata = {
  title: "Data Anggota - Admin",
};

export default async function AdminAnggotaPage() {
  const [anggotaList, kelompokList] = await Promise.all([
    getAnggotaAction(),
    getKelompokAction(),
  ]);

  return <AnggotaView initialAnggota={anggotaList} kelompokList={kelompokList} />;
}
