"use server";

import {
  fetchIndividuLeaderboard,
  fetchKelompokLeaderboard,
} from "@/services/leaderboard.service";
import type { IndividuLeaderboardItem, KelompokLeaderboardItem } from "@/types/database";

export async function getKelompokLeaderboardAction(): Promise<KelompokLeaderboardItem[]> {
  return fetchKelompokLeaderboard();
}

export async function getIndividuLeaderboardAction(): Promise<IndividuLeaderboardItem[]> {
  return fetchIndividuLeaderboard();
}
