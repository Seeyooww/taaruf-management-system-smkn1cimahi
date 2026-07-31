import { getLPJSummaryAction } from "@/services/reporting.actions";
import { LPJView } from "@/components/admin/reporting/lpj-view";

export const metadata = {
  title: "LPJ Rekap Akhir Acara - TMS Admin",
};

export default async function AdminLPJPage() {
  const data = await getLPJSummaryAction();

  return <LPJView data={data} />;
}
