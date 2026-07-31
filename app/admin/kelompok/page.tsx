import { getKelompokAction } from "@/services/kelompok.actions";
import { KelompokView } from "@/components/admin/kelompok-view";

export const metadata = {
  title: "Data Kelompok - Admin",
};

export default async function AdminKelompokPage() {
  const data = await getKelompokAction();
  return <KelompokView initialData={data} />;
}
