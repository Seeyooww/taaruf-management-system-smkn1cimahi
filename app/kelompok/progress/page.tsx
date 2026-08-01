import { redirect } from "next/navigation";
import { getKelompokIdFromSession } from "@/services/auth.service";
import { getAnggotaProgressAction } from "@/services/progress.actions";
import { KelompokProgressView } from "@/components/kelompok/kelompok-progress-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Progress Anggota - Kelompok",
};

export default async function KelompokProgressPage() {
  const kelompokId = await getKelompokIdFromSession();

  if (!kelompokId) {
    redirect("/kelompok/login");
  }

  const progressList = await getAnggotaProgressAction(kelompokId);

  return <KelompokProgressView progressList={progressList} />;
}
