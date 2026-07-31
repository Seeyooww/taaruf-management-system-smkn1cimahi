"use client";

import * as React from "react";
import { Award, Code2, Heart, Info, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TentangView() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Hero Header */}
      <div className="text-center space-y-3 py-6 rounded-3xl border bg-gradient-to-b from-primary/15 via-primary/5 to-transparent p-8">
        <div className="mx-auto size-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-xs">
          <Sparkles className="size-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Taaruf Management System (TMS)
        </h1>
        <p className="text-sm font-semibold text-primary">
          SMKN 1 Cimahi — Versi 1.0.0 (Production Ready)
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Badge variant="outline" className="border-primary/40 text-primary">
            Next.js 14 App Router
          </Badge>
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
            TailwindCSS & Glassmorphism
          </Badge>
          <Badge variant="outline" className="border-indigo-500/40 text-indigo-600 dark:text-indigo-400">
            Supabase DB Ready
          </Badge>
        </div>
      </div>

      {/* Developer Card */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code2 className="size-5 text-primary" /> Informasi Pengembang (Developer)
          </CardTitle>
          <CardDescription className="text-xs">
            Kreator dan pengembang utama Taaruf Management System SMKN 1 Cimahi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Lead System Architect & Fullstack Developer
              </div>
              <div className="text-xl font-extrabold text-foreground">
                Seo Daffaa Pramudya
              </div>
              <div className="text-xs text-muted-foreground">
                Siswa / Alumni SMKN 1 Cimahi
              </div>
            </div>
            <Badge variant="default" className="bg-primary px-4 py-1 text-xs">
              Developer Official
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* App Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> Keunggulan Fitur
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <ul className="list-disc pl-4 space-y-1">
              <li>Anti-Collision Booking Engine real-time.</li>
              <li>Validasi ketat 8-Point Backend Integrity.</li>
              <li>Pencatatan Presensi & Progress otomatis per anggota.</li>
              <li>Laporan Kelompok, Anggota, Kating, & Rekap LPJ.</li>
              <li>Export Excel, PDF, CSV, & Cetak dokumen standar A4.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="size-4 text-blue-500" /> Hak Cipta & Lisensi
            </CardTitle>
          </CardHeader>

          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              Hak Cipta &copy; 2026{" "}
              <strong>Taaruf Management System (TMS)</strong>. Seluruh hak cipta
              dilindungi undang-undang. Didedikasikan untuk kelancaran kegiatan
              Taaruf di SMKN 1 Cimahi.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
