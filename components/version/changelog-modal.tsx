"use client";

import * as React from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  GitCommit,
  Rocket,
  Shield,
  Sparkles,
  Tag,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChangelogCategory, SystemVersion } from "@/types/database";

interface ChangelogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVersion: SystemVersion | null;
  allVersions: SystemVersion[];
}

export function getCategoryBadge(category: ChangelogCategory) {
  switch (category) {
    case "FEATURE":
      return {
        label: "Feature",
        icon: Rocket,
        variant: "primary" as const,
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      };
    case "IMPROVEMENT":
      return {
        label: "Improvement",
        icon: Sparkles,
        variant: "secondary" as const,
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    case "BUGFIX":
      return {
        label: "Bug Fix",
        icon: Wrench,
        variant: "success" as const,
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    case "SECURITY":
      return {
        label: "Security",
        icon: Shield,
        variant: "warning" as const,
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      };
    case "BREAKING":
      return {
        label: "Breaking Change",
        icon: AlertTriangle,
        variant: "destructive" as const,
        className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      };
    default:
      return {
        label: category,
        icon: Tag,
        variant: "outline" as const,
        className: "",
      };
  }
}

export function ChangelogModal({
  open,
  onOpenChange,
  currentVersion,
  allVersions,
}: ChangelogModalProps) {
  const [expandedVersions, setExpandedVersions] = React.useState<Set<string>>(new Set());

  const toggleVersionExpand = (versionStr: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(versionStr)) next.delete(versionStr);
      else next.add(versionStr);
      return next;
    });
  };

  const activeVer = currentVersion || allVersions.find((v) => v.current) || allVersions[0];
  const previousVers = allVersions.filter((v) => v.version !== activeVer?.version);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 font-extrabold text-base sm:text-lg text-primary">
              <FileText className="size-5" /> TMS Changelog & Release Notes
            </DialogTitle>
            {activeVer && (
              <Badge variant="success" className="text-xs font-mono font-bold px-2.5 py-0.5">
                🟢 {activeVer.status}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Riwayat pembaruan resmi Taaruf Management System (TMS) SMKN 1 Cimahi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* ── CURRENT VERSION HEADER BOX ─────────────────────────────────── */}
          {activeVer && (
            <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-card p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/20 pb-2.5">
                <div>
                  <div className="text-[10px] uppercase font-bold text-primary tracking-wider">
                    Versi Saat Ini (Current Version)
                  </div>
                  <div className="text-xl font-extrabold font-mono text-foreground flex items-center gap-2">
                    {activeVer.version}
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                      Build: {activeVer.build}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Rilis: <strong className="text-foreground">{activeVer.release_date}</strong>
                </div>
              </div>

              {/* Current Version Changelog Groups */}
              <div className="space-y-4 pt-1">
                {(["FEATURE", "IMPROVEMENT", "BUGFIX", "SECURITY", "BREAKING"] as ChangelogCategory[]).map((cat) => {
                  const items = (activeVer.changelogs ?? []).filter((c) => c.category === cat);
                  if (items.length === 0) return null;

                  const badgeInfo = getCategoryBadge(cat);
                  const Icon = badgeInfo.icon;

                  let groupTitle = "New Features";
                  if (cat === "IMPROVEMENT") groupTitle = "Improvements";
                  if (cat === "BUGFIX") groupTitle = "Bug Fixes";
                  if (cat === "SECURITY") groupTitle = "Security Updates";
                  if (cat === "BREAKING") groupTitle = "Breaking Changes";

                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${badgeInfo.className} flex items-center gap-1`}>
                          <Icon className="size-3" /> {badgeInfo.label}
                        </Badge>
                        <span>{groupTitle}</span>
                      </div>
                      <div className="space-y-1.5 pl-3 border-l-2 border-primary/20">
                        {items.map((item) => (
                          <div key={item.id} className="text-xs leading-relaxed">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>• {item.title}</span>
                              {item.important && (
                                <Badge variant="destructive" className="text-[9px] h-4 px-1">
                                  Penting
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-muted-foreground pl-3 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PREVIOUS VERSIONS ACCORDION TIMELINE ───────────────────────── */}
          {previousVers.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <GitCommit className="size-4 text-primary" /> Riwayat Versi Sebelumnya (Previous Versions)
              </h3>

              <div className="space-y-2">
                {previousVers.map((ver) => {
                  const isExpanded = expandedVersions.has(ver.version);
                  return (
                    <div key={ver.id} className="rounded-xl border border-border/60 bg-card/60 overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => toggleVersionExpand(ver.version)}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold font-mono text-sm text-foreground">{ver.version}</span>
                          <span className="text-[11px] text-muted-foreground">({ver.release_date})</span>
                          <Badge variant="secondary" className="text-[9px]">
                            {ver.changelogs?.length || 0} Perubahan
                          </Badge>
                        </div>
                        {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                      </button>

                      {isExpanded && (
                        <div className="p-3 pt-0 border-t border-border/40 space-y-3 bg-muted/20 animate-in fade-in duration-200">
                          {(ver.changelogs ?? []).length === 0 ? (
                            <p className="text-[11px] text-muted-foreground py-2">Tidak ada catatan changelog khusus untuk versi ini.</p>
                          ) : (
                            (["FEATURE", "IMPROVEMENT", "BUGFIX", "SECURITY", "BREAKING"] as ChangelogCategory[]).map((cat) => {
                              const items = (ver.changelogs ?? []).filter((c) => c.category === cat);
                              if (items.length === 0) return null;
                              const badgeInfo = getCategoryBadge(cat);
                              const Icon = badgeInfo.icon;
                              return (
                                <div key={cat} className="space-y-1.5 pt-2">
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0.5 border ${badgeInfo.className} flex items-center gap-1`}>
                                      <Icon className="size-2.5" /> {badgeInfo.label}
                                    </Badge>
                                  </div>
                                  <ul className="space-y-1 pl-3 list-disc list-inside text-[11px] text-muted-foreground">
                                    {items.map((it) => (
                                      <li key={it.id}>
                                        <strong className="text-foreground">{it.title}</strong>
                                        {it.description ? ` — ${it.description}` : ""}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
