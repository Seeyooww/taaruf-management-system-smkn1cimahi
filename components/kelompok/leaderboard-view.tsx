"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Award, Lock, Minus, Search, Target, TrendingDown, TrendingUp, Trophy, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { IndividuLeaderboardItem, KelompokLeaderboardItem } from "@/types/database";

interface LeaderboardViewProps {
  kelompokLeaderboard: KelompokLeaderboardItem[];
  individuLeaderboard: IndividuLeaderboardItem[];
}

function formatDate(isoString: string | null) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    const datePart = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
    });
    const timePart = d
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(".", ":");
    return `${datePart} ${timePart}`;
  } catch {
    return isoString;
  }
}

type ActiveTab = "kelompok" | "individu";
type RankDelta = "up" | "down" | "same" | "new";

interface RankIndicatorProps {
  delta: RankDelta;
  diff: number;
}

function RankIndicator({ delta, diff }: RankIndicatorProps) {
  if (delta === "new") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
        <Minus className="size-3" /> —
      </span>
    );
  }
  if (delta === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="size-3" /> +{diff}
      </span>
    );
  }
  if (delta === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-500 dark:text-rose-400">
        <TrendingDown className="size-3" /> -{diff}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
      <Minus className="size-3" /> Tetap
    </span>
  );
}

function computeRankDelta(
  currentRank: number,
  id: string,
  prevRankMap: Map<string, number>
): { delta: RankDelta; diff: number } {
  if (!prevRankMap.has(id)) return { delta: "new", diff: 0 };
  const prev = prevRankMap.get(id)!;
  const diff = prev - currentRank;
  if (diff > 0) return { delta: "up", diff };
  if (diff < 0) return { delta: "down", diff: Math.abs(diff) };
  return { delta: "same", diff: 0 };
}

export function LeaderboardView({
  kelompokLeaderboard,
  individuLeaderboard,
}: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("kelompok");
  const [kelompokSearch, setKelompokSearch] = React.useState("");
  const [individuSearch, setIndividuSearch] = React.useState("");

  // ── Rank delta tracking (session-only, no DB) ───────────────────────────
  // On mount, snapshot current ranks so we can compare on next render cycle.
  // In practice this detects rank changes that happen during the same client session
  // (e.g. after router.refresh() triggered by another tab).
  const prevKelompokRanks = React.useRef<Map<string, number>>(new Map());
  const prevIndividuRanks = React.useRef<Map<string, number>>(new Map());
  const isFirstRender = React.useRef(true);

  // Current rank maps built from props
  const currentKelompokRankMap = React.useMemo(() => {
    const m = new Map<string, number>();
    kelompokLeaderboard.forEach((item) => m.set(item.kelompok_id, item.rank));
    return m;
  }, [kelompokLeaderboard]);

  const currentIndividuRankMap = React.useMemo(() => {
    const m = new Map<string, number>();
    individuLeaderboard.forEach((item) => m.set(item.anggota_id, item.rank));
    return m;
  }, [individuLeaderboard]);

  // On first render, treat all as "new" (show —). Subsequent renders compare.
  React.useEffect(() => {
    if (isFirstRender.current) {
      // Seed prevRanks with current so they show "Tetap" after the next change
      prevKelompokRanks.current = new Map(currentKelompokRankMap);
      prevIndividuRanks.current = new Map(currentIndividuRankMap);
      isFirstRender.current = false;
    } else {
      // Update stored ranks AFTER computing deltas (in render)
      // We update AFTER render so the indicator reflects the change
      const rafId = requestAnimationFrame(() => {
        prevKelompokRanks.current = new Map(currentKelompokRankMap);
        prevIndividuRanks.current = new Map(currentIndividuRankMap);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [currentKelompokRankMap, currentIndividuRankMap]);

  // ── Filtered lists (client-side, no DB requests) ────────────────────────
  const filteredKelompok = React.useMemo(() => {
    const q = kelompokSearch.toLowerCase().trim();
    if (!q) return kelompokLeaderboard;
    return kelompokLeaderboard.filter(
      (item) =>
        item.kelompok_nama.toLowerCase().includes(q) ||
        String(item.nomor_kelompok).includes(q) ||
        item.kelas.toLowerCase().includes(q)
    );
  }, [kelompokLeaderboard, kelompokSearch]);

  const filteredIndividu = React.useMemo(() => {
    const q = individuSearch.toLowerCase().trim();
    if (!q) return individuLeaderboard;
    return individuLeaderboard.filter(
      (item) =>
        item.nama.toLowerCase().includes(q) ||
        item.kelompok_nama.toLowerCase().includes(q) ||
        String(item.kelompok_id).toLowerCase().includes(q)
    );
  }, [individuLeaderboard, individuSearch]);

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Link href="/kelompok/dashboard">
            <ArrowLeft className="mr-1.5 size-3.5" /> Kembali ke Dashboard Kelompok
          </Link>
        </Button>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              <Trophy className="size-3.5 shrink-0" /> Peringkat Resmi Taaruf
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">🏆 Leaderboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Klasemen pencapaian progress kelompok &amp; individu sesi Taaruf SMKN 1 Cimahi.
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit shrink-0 text-xs font-semibold px-3 py-1 bg-background/50"
          >
            ✨ READ ONLY
          </Badge>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border max-w-md">
        <Button
          size="sm"
          variant={activeTab === "kelompok" ? "default" : "ghost"}
          onClick={() => setActiveTab("kelompok")}
          className="flex-1 h-8 text-xs font-semibold px-2"
        >
          <Users className="mr-1 size-3.5 shrink-0" />
          <span className="hidden xs:inline">Leaderboard </span>Kelompok
        </Button>
        <Button
          size="sm"
          variant={activeTab === "individu" ? "default" : "ghost"}
          onClick={() => setActiveTab("individu")}
          className="flex-1 h-8 text-xs font-semibold px-2"
        >
          <Award className="mr-1 size-3.5 shrink-0" />
          <span className="hidden xs:inline">Leaderboard </span>Individu
        </Button>
      </div>

      {/* ── TAB 1: LEADERBOARD KELOMPOK ─────────────────────────────────── */}
      {activeTab === "kelompok" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari nomor / nama kelompok..."
              value={kelompokSearch}
              onChange={(e) => setKelompokSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 gap-3">
            {filteredKelompok.length === 0 ? (
              <Card className="glass-card p-8 text-center text-xs text-muted-foreground">
                {kelompokSearch ? "Tidak ada kelompok yang cocok." : "Belum ada data peringkat kelompok."}
              </Card>
            ) : (
              filteredKelompok.map((item) => {
                const formattedCompletionDate = formatDate(item.completed_at);
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;
                const showRankNumber = item.rank <= 10;
                const { delta, diff } = computeRankDelta(
                  item.rank,
                  item.kelompok_id,
                  prevKelompokRanks.current
                );

                let cardStyle = "glass-card border-border/60 hover:border-primary/40";
                let badgeRank = null;

                if (isTop1) {
                  cardStyle =
                    "border-2 border-amber-400/80 bg-gradient-to-r from-amber-500/15 via-amber-400/5 to-transparent shadow-md dark:border-amber-500/80";
                  badgeRank = (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 text-amber-950 text-xs font-black shadow-xs shrink-0">
                      🥇 <span className="hidden sm:inline">Juara </span>1
                    </span>
                  );
                } else if (isTop2) {
                  cardStyle =
                    "border-2 border-slate-300 bg-gradient-to-r from-slate-400/15 via-slate-300/5 to-transparent shadow-sm dark:border-slate-500/80";
                  badgeRank = (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-300 text-slate-900 text-xs font-bold shadow-xs shrink-0">
                      🥈 <span className="hidden sm:inline">Juara </span>2
                    </span>
                  );
                } else if (isTop3) {
                  cardStyle =
                    "border-2 border-amber-700/60 bg-gradient-to-r from-amber-700/15 via-amber-600/5 to-transparent shadow-sm dark:border-amber-600/70";
                  badgeRank = (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-700 text-amber-100 text-xs font-bold shadow-xs shrink-0">
                      🥉 <span className="hidden sm:inline">Juara </span>3
                    </span>
                  );
                }

                return (
                  <Card
                    key={item.kelompok_id}
                    className={`transition-all duration-200 ${cardStyle}`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Left: Rank badge + Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          {showRankNumber && !badgeRank && (
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted font-mono font-extrabold text-sm text-muted-foreground border">
                              #{item.rank}
                            </div>
                          )}
                          {badgeRank && <div className="shrink-0">{badgeRank}</div>}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm text-foreground tracking-tight truncate">
                                {item.kelompok_nama}
                              </h3>
                              <Badge variant="outline" className="text-[10px] font-medium shrink-0">
                                {item.kelas}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-muted-foreground">
                                {item.anggota_selesai}/{item.total_anggota} anggota selesai
                              </p>
                              <RankIndicator delta={delta} diff={diff} />
                            </div>
                          </div>
                        </div>

                        {/* Right: Progress */}
                        <div className="flex-1 sm:max-w-[240px] min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">
                              {item.total_progress}/{item.total_target}
                            </span>
                            <span className="font-extrabold text-primary text-sm tabular-nums">
                              {item.persentase}%
                            </span>
                          </div>
                          <Progress
                            value={item.persentase}
                            className="h-2 bg-muted/60"
                            indicatorClassName={
                              item.target_tercapai ? "bg-emerald-500" : "bg-primary"
                            }
                          />
                        </div>
                      </div>

                      {/* Lock row */}
                      {item.completed_at && (
                        <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="success" className="text-[10px] font-semibold gap-1">
                              <Target className="size-3" /> 🎯 Target Tercapai
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold gap-1 border border-primary/20 text-primary bg-primary/10"
                            >
                              <Lock className="size-3 text-primary" /> 🔒 Posisi Terkunci
                            </Badge>
                          </div>
                          {formattedCompletionDate && (
                            <span className="text-[11px] font-medium text-muted-foreground">
                              Selesai:{" "}
                              <span className="font-bold text-foreground">
                                {formattedCompletionDate}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: LEADERBOARD INDIVIDU ─────────────────────────────────── */}
      {activeTab === "individu" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari nama / kelompok..."
              value={individuSearch}
              onChange={(e) => setIndividuSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 gap-3">
            {filteredIndividu.length === 0 ? (
              <Card className="glass-card p-8 text-center text-xs text-muted-foreground">
                {individuSearch ? "Tidak ada anggota yang cocok." : "Belum ada data peringkat individu."}
              </Card>
            ) : (
              filteredIndividu.map((item) => {
                const formattedCompletionDate = formatDate(item.completed_at);
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;
                const showRankNumber = item.rank <= 25;
                const { delta, diff } = computeRankDelta(
                  item.rank,
                  item.anggota_id,
                  prevIndividuRanks.current
                );

                let cardStyle = "glass-card border-border/60 hover:border-primary/40";
                let badgeRank = null;

                if (isTop1) {
                  cardStyle =
                    "border-2 border-amber-400/80 bg-gradient-to-r from-amber-500/15 via-amber-400/5 to-transparent shadow-md dark:border-amber-500/80";
                  badgeRank = (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 text-amber-950 text-xs font-black shadow-xs shrink-0">
                      🥇 <span className="hidden sm:inline">Juara </span>1
                    </span>
                  );
                } else if (isTop2) {
                  cardStyle =
                    "border-2 border-slate-300 bg-gradient-to-r from-slate-400/15 via-slate-300/5 to-transparent shadow-sm dark:border-slate-500/80";
                  badgeRank = (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-300 text-slate-900 text-xs font-bold shadow-xs shrink-0">
                      🥈 <span className="hidden sm:inline">Juara </span>2
                    </span>
                  );
                } else if (isTop3) {
                  cardStyle =
                    "border-2 border-amber-700/60 bg-gradient-to-r from-amber-700/15 via-amber-600/5 to-transparent shadow-sm dark:border-amber-600/70";
                  badgeRank = (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-700 text-amber-100 text-xs font-bold shadow-xs shrink-0">
                      🥉 <span className="hidden sm:inline">Juara </span>3
                    </span>
                  );
                }

                return (
                  <Card
                    key={item.anggota_id}
                    className={`transition-all duration-200 ${cardStyle}`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Left: Rank badge + Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          {showRankNumber && !badgeRank && (
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted font-mono font-extrabold text-sm text-muted-foreground border">
                              #{item.rank}
                            </div>
                          )}
                          {badgeRank && <div className="shrink-0">{badgeRank}</div>}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm text-foreground tracking-tight truncate">
                                {item.nama}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`text-[10px] shrink-0 ${
                                  item.jenis_kelamin === "L"
                                    ? "border-primary/30 text-primary"
                                    : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {item.jenis_kelamin === "L" ? "L" : "P"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <p className="text-xs text-muted-foreground">
                                {item.kelompok_nama} • {item.kelas}
                              </p>
                              <RankIndicator delta={delta} diff={diff} />
                            </div>
                          </div>
                        </div>

                        {/* Right: Progress */}
                        <div className="flex-1 sm:max-w-[240px] min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">
                              {item.total_kating_met}/{item.target_kating} kating
                            </span>
                            <span className="font-extrabold text-primary text-sm tabular-nums">
                              {item.persentase}%
                            </span>
                          </div>
                          <Progress
                            value={item.persentase}
                            className="h-2 bg-muted/60"
                            indicatorClassName={
                              item.target_tercapai ? "bg-emerald-500" : "bg-primary"
                            }
                          />
                        </div>
                      </div>

                      {/* Lock row */}
                      {item.completed_at && (
                        <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="success" className="text-[10px] font-semibold gap-1">
                              <Target className="size-3" /> 🎯 Target Tercapai
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold gap-1 border border-primary/20 text-primary bg-primary/10"
                            >
                              <Lock className="size-3 text-primary" /> 🔒 Posisi Terkunci
                            </Badge>
                          </div>
                          {formattedCompletionDate && (
                            <span className="text-[11px] font-medium text-muted-foreground">
                              Selesai:{" "}
                              <span className="font-bold text-foreground">
                                {formattedCompletionDate}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
