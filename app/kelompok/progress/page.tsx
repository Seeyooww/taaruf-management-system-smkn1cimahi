import { getAnggotaProgressAction } from "@/services/progress.actions";
import { getSessionProfile } from "@/services/auth.service";
import { KelompokProgressView } from "@/components/kelompok/kelompok-progress-view";

export const metadata = {
  title: "Progress Anggota - Kelompok",
};

export default async function KelompokProgressPage() {
  const session = await getSessionProfile();
  const kelompokId = session?.id || "kel-1";
  const progressList = await getAnggotaProgressAction(kelompokId);

  return <KelompokProgressView progressList={progressList} />;
}
