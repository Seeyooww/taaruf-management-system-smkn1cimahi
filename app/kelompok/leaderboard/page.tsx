import { redirect } from "next/navigation";
import { getSessionProfile } from "@/services/auth.service";
import { getIndividuLeaderboardAction, getKelompokLeaderboardAction } from "@/services/leaderboard.actions";
import { LeaderboardView } from "@/components/kelompok/leaderboard-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "🏆 Leaderboard - TMS SMKN 1 Cimahi",
};

export default async function KelompokLeaderboardPage() {
  const session = await getSessionProfile();
  if (!session) {
    redirect("/kelompok/login");
  }

  const [kelompokLeaderboard, individuLeaderboard] = await Promise.all([
    getKelompokLeaderboardAction(),
    getIndividuLeaderboardAction(),
  ]);

  return (
    <LeaderboardView
      kelompokLeaderboard={kelompokLeaderboard}
      individuLeaderboard={individuLeaderboard}
    />
  );
}
