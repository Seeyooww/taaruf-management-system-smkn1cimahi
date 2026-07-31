"use client";

import * as React from "react";
import { History, Search, Shield, User, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActivityLog, ActivityType } from "@/types/activity";

interface AdminRiwayatViewProps {
  initialLogs: ActivityLog[];
}

export function AdminRiwayatView({ initialLogs }: AdminRiwayatViewProps) {
  const [logs] = React.useState<ActivityLog[]>(initialLogs);
  const [search, setSearch] = React.useState("");

  const [dateFilter, setDateFilter] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState<string>("all");

  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();
      const matchSearch =
        log.user_name.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q);

      const logDate = log.created_at.split("T")[0];
      const matchDate = dateFilter ? logDate === dateFilter : true;
      const matchAction = actionFilter === "all" ? true : log.action === actionFilter;

      return matchSearch && matchDate && matchAction;
    });
  }, [logs, search, dateFilter, actionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page]);

  const getActionBadge = (action: ActivityType) => {
    switch (action) {
      case "Login":
        return <Badge variant="outline">Login</Badge>;
      case "Booking Dibuat":
        return <Badge variant="warning">Booking Dibuat</Badge>;
      case "Booking Disetujui":
        return <Badge variant="success">Booking Disetujui</Badge>;
      case "Booking Dibatalkan":
        return <Badge variant="destructive">Booking Dibatalkan</Badge>;
      case "Progress Dihitung":
        return <Badge variant="secondary">Progress Dihitung</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Aktivitas Sistem</h1>
          <p className="text-xs text-muted-foreground">
            Catatan log audit otomatis aktivitas admin dan kelompok.
          </p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="size-4 text-primary" /> Log Aktivitas ({filteredLogs.length})
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari log / pengguna..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs w-36"
              />

              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="all">Semua Jenis Aktivitas</option>
                <option value="Login">Login</option>
                <option value="Booking Dibuat">Booking Dibuat</option>
                <option value="Booking Disetujui">Booking Disetujui</option>
                <option value="Booking Dibatalkan">Booking Dibatalkan</option>
                <option value="Progress Dihitung">Progress Dihitung</option>
                <option value="Pengaturan Diubah">Pengaturan Diubah</option>
                <option value="Import Data">Import Data</option>
              </select>

              {(dateFilter || actionFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFilter("");
                    setActionFilter("all");
                  }}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Waktu / Tanggal</TableHead>
                <TableHead className="w-40">Pengguna</TableHead>
                <TableHead className="w-40">Jenis Aktivitas</TableHead>
                <TableHead>Rincian Aktivitas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs">
                    Tidak ada catatan riwayat aktivitas ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3 text-primary" />
                        {new Date(log.created_at).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs">
                      <div className="flex items-center gap-1.5">
                        {log.role === "admin" ? (
                          <Shield className="size-3.5 text-primary" />
                        ) : (
                          <User className="size-3.5 text-emerald-500" />
                        )}
                        <span>{log.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="text-xs text-foreground leading-relaxed">
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
            <span>
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
