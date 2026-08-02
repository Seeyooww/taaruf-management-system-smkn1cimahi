"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Shield,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import type { LPJSummaryData } from "@/services/reporting.service";
import { exportToCSV, exportToExcel, exportToPDF, triggerPrint } from "@/utils/export-utils";

interface LPJViewProps {
  data: LPJSummaryData;
}

export function LPJView({ data }: LPJViewProps) {
  const prepareExportData = () => {
    const headers = ["Metrik Laporan LPJ", "Jumlah / Nilai", "Keterangan"];
    const rows = [
      ["Jumlah Kelompok", data.totalKelompok, "Kelompok peserta terdaftar"],
      ["Jumlah Anggota", data.totalAnggota, "Siswa/i peserta terdata"],
      ["Jumlah Kating", data.totalKating, "Akang & Teteh pendamping"],
      ["Jumlah Booking", data.totalBooking, "Total pengajuan sesi Taaruf"],
      ["Booking Berhasil", data.bookingBerhasil, "Sesi Selesai / Disetujui"],
      ["Booking Gagal", data.bookingGagal, "Sesi Ditolak / Dibatalkan"],
      ["Target Tercapai", data.targetTercapai, "Siswa memenuhi kriteria kating"],
      ["Target Belum Tercapai", data.targetBelumTercapai, "Siswa belum memenuhi target"],
      ["Persentase Capaian Target", `${data.persentaseTargetSistem}%`, "Tingkat keberhasilan siswa"],
      ["Persentase Kelulusan Booking", `${data.persentaseKelulusanBooking}%`, "Tingkat keberhasilan booking"],
    ];
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = prepareExportData();
    exportToCSV("LPJ_Rekap_Akhir_Acara_TMS", headers, rows);
  };

  const handleExportExcel = () => {
    const { headers, rows } = prepareExportData();
    exportToExcel("LPJ_Rekap_Akhir_Acara_TMS", headers, rows);
  };

  const handleExportPDF = () => {
    const { headers, rows } = prepareExportData();
    exportToPDF("Laporan Pertanggungjawaban (LPJ) Rekap Akhir Acara", headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Award className="size-6 text-amber-500" /> Rekap Akhir Acara (LPJ)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Laporan pertanggungjawaban resmi seluruh data operasional, statistik presensi, & kelulusan target Taaruf.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button size="sm" variant="outline" onClick={handleExportCSV} className="text-xs">
            <Download className="size-3.5 mr-1 text-blue-500" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportExcel} className="text-xs">
            <FileSpreadsheet className="size-3.5 mr-1 text-emerald-500" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportPDF} className="text-xs">
            <FileText className="size-3.5 mr-1 text-rose-500" /> PDF
          </Button>
          <Button size="sm" onClick={triggerPrint} className="text-xs">
            <Printer className="size-3.5 mr-1" /> Cetak LPJ
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jumlah Kelompok */}
        <Card className="glass-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Jumlah Kelompok
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">{data.totalKelompok}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Kelompok terdaftar di sistem</p>
          </CardContent>
        </Card>

        {/* Jumlah Anggota */}
        <Card className="glass-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Jumlah Anggota
            </CardTitle>
            <UserCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {data.totalAnggota}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Siswa/i peserta terdata</p>
          </CardContent>
        </Card>

        {/* Jumlah Kating */}
        <Card className="glass-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Jumlah Kating
            </CardTitle>
            <Shield className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {data.totalKating}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Akang & Teteh pendamping</p>
          </CardContent>
        </Card>

        {/* Jumlah Booking */}
        <Card className="glass-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Jumlah Booking
            </CardTitle>
            <CalendarCheck className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {data.totalBooking}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total pengajuan sesi</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Outcome Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Booking Berhasil */}
        <Card className="glass-card border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Booking Berhasil
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {data.bookingBerhasil}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Selesai / Disetujui</p>
          </CardContent>
        </Card>

        {/* Booking Gagal */}
        <Card className="glass-card border-rose-500/20 bg-rose-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              Booking Gagal
            </CardTitle>
            <XCircle className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {data.bookingGagal}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Ditolak / Dibatalkan</p>
          </CardContent>
        </Card>

        {/* Target Tercapai */}
        <Card className="glass-card border-purple-500/20 bg-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              Target Tercapai
            </CardTitle>
            <Award className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
              {data.targetTercapai}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Memenuhi target kating</p>
          </CardContent>
        </Card>

        {/* Target Belum Tercapai */}
        <Card className="glass-card border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              Target Belum Tercapai
            </CardTitle>
            <Users className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {data.targetBelumTercapai}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Belum mencapai target</p>
          </CardContent>
        </Card>
      </div>

      {/* Official Executive Summary Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Ringkasan Resmi Laporan Pertanggungjawaban (LPJ)</CardTitle>
          <CardDescription className="text-xs">
            Evaluasi menyeluruh pelaksanaan acara Taaruf SMKN 1 Cimahi.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-y font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">Indikator Kinerja</th>
                  <th className="p-3 text-center">Jumlah / Nilai</th>
                  <th className="p-3 text-center">Persentase</th>
                  <th className="p-3">Keterangan Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-semibold text-foreground">Total Kelompok Peserta</td>
                  <td className="p-3 text-center font-bold">{data.totalKelompok}</td>
                  <td className="p-3 text-center">100%</td>
                  <td className="p-3 text-muted-foreground">Seluruh kelompok terdaftar dan aktif</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-foreground">Total Anggota Siswa/i</td>
                  <td className="p-3 text-center font-bold">{data.totalAnggota}</td>
                  <td className="p-3 text-center">100%</td>
                  <td className="p-3 text-muted-foreground">Peserta didik baru SMKN 1 Cimahi</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-foreground">Total Kating Pendamping</td>
                  <td className="p-3 text-center font-bold">{data.totalKating}</td>
                  <td className="p-3 text-center">100%</td>
                  <td className="p-3 text-muted-foreground">Kakak tingkat pendamping Taaruf</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-foreground">Total Pengajuan Sesi Booking</td>
                  <td className="p-3 text-center font-bold">{data.totalBooking}</td>
                  <td className="p-3 text-center">100%</td>
                  <td className="p-3 text-muted-foreground">Seluruh pengajuan via sistem TMS</td>
                </tr>
                <tr className="bg-emerald-500/5">
                  <td className="p-3 font-semibold text-emerald-700 dark:text-emerald-300">
                    Tingkat Keberhasilan Sesi (Booking Berhasil)
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-600">
                    {data.bookingBerhasil}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="default" className="text-[10px] bg-emerald-600">
                      {data.persentaseKelulusanBooking}%
                    </Badge>
                  </td>
                  <td className="p-3 text-emerald-700 dark:text-emerald-300">
                    Sesi Taaruf terlaksana secara sah dan tercatat presensinya
                  </td>
                </tr>
                <tr className="bg-purple-500/5">
                  <td className="p-3 font-semibold text-purple-700 dark:text-purple-300">
                    Tingkat Kelulusan Target Siswa (Mencapai Target)
                  </td>
                  <td className="p-3 text-center font-bold text-purple-600">
                    {data.targetTercapai}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="default" className="text-[10px] bg-purple-600">
                      {data.persentaseTargetSistem}%
                    </Badge>
                  </td>
                  <td className="p-3 text-purple-700 dark:text-purple-300">
                    Siswa/i yang memenuhi kuota kating minimal yang ditentukan acara
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Formal Print Signature Block */}
      <div className="hidden print:block pt-12 space-y-12">
        <div className="text-right text-xs">
          Cimahi, {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
        </div>

        <div className="grid grid-cols-3 gap-8 text-center text-xs">
          <div className="space-y-16">
            <p>Ketua Pelaksana</p>
            <div className="border-b border-black w-3/4 mx-auto" />
            <p className="font-bold">Panitia Taaruf 2026</p>
          </div>

          <div className="space-y-16">
            <p>Pembimbing Kegiatan</p>
            <div className="border-b border-black w-3/4 mx-auto" />
            <p className="font-bold">Pembina Kesiswaan</p>
          </div>

          <div className="space-y-16">
            <p>Administrator Sistem</p>
            <div className="border-b border-black w-3/4 mx-auto" />
            <p className="font-bold">Admin TMS SMKN 1 Cimahi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
