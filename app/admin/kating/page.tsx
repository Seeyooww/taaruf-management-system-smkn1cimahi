import { getKatingAction } from "@/services/kating.actions";
import { KatingView } from "@/components/admin/kating-view";

export const metadata = {
  title: "Data Kating - Admin",
};

export default async function AdminKatingPage() {
  const data = await getKatingAction();
  return <KatingView initialKating={data} />;
}
