"use client";

import * as React from "react";
import {
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  MessageSquare,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PanduanView() {
  const [activeTab, setActiveTab] = React.useState<"admin" | "kelompok">("admin");

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panduan Penggunaan Sistem</h1>
          <p className="text-xs text-muted-foreground">
            Petunjuk teknis operasional untuk Admin Panitia dan Pembimbing Kelompok.
          </p>
        </div>
        <div className="flex rounded-xl bg-muted p-1 gap-1 border">
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "admin"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🛡️ Panduan Admin
          </button>
          <button
            onClick={() => setActiveTab("kelompok")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "kelompok"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            👥 Panduan Kelompok
          </button>
        </div>
      </div>

      {activeTab === "admin" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Admin Guide 1 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4 text-primary" /> 1. Cara Input Data Kelompok
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Buka menu <strong>Master Data &rarr; Data Kelompok</strong>:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Klik tombol <strong>+ Tambah Kelompok</strong>.</li>
                <li>Isi Nomor Kelompok (contoh: <code>1</code>), Kelas (contoh: <code>X SIJA 1</code>), dan Username login.</li>
                <li>Klik <strong>Simpan Kelompok</strong>. Data siap digunakan untuk login kelompok.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Admin Guide 2 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="size-4 text-emerald-500" /> 2. Cara Input Data Anggota
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Buka menu <strong>Master Data &rarr; Data Anggota</strong>:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Klik <strong>+ Tambah Anggota</strong> untuk menginput 1 siswa/i.</li>
                <li>Atau klik <strong>Import CSV</strong> untuk mengunggah banyak data siswa sekaligus.</li>
                <li>Pastikan setiap anggota terhubung ke ID Kelompok yang sesuai.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Admin Guide 3 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="size-4 text-indigo-500" /> 3. Cara Input Data Kating
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Buka menu <strong>Master Data &rarr; Data Kating</strong>:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Isi nama Kating, Kelas, Jenis Kelamin (Akang / Teteh), dan Nomor WhatsApp aktif.</li>
                <li>Nomor WhatsApp digunakan untuk fitur auto-send chat konfirmasi booking dari kelompok.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Admin Guide 4 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="size-4 text-amber-500" /> 4. Cara Approve & Verifikasi Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Buka menu <strong>Permohonan Booking</strong>:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Periksa daftar booking berstatus <strong>Menunggu Konfirmasi</strong>.</li>
                <li>Klik <strong>Setujui</strong> untuk mengonfirmasi atau <strong>Tolak</strong> jika bentrok acara.</li>
                <li>Setelah sesi berlangsung, klik <strong>Presensi & Selesai</strong> untuk mencatat kehadiran anggota dan menambah progress otomatis.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Admin Guide 5 */}
          <Card className="glass-card md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Award className="size-4" /> 5. Cara Export & Cetak LPJ (Rekap Akhir)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Buka menu <strong>Pelaporan &rarr; Rekap LPJ</strong>:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Dapatkan ringkasan statistik ketercapaian target sistem dan kelulusan booking.</li>
                <li>Gunakan tombol <strong>Ekspor Excel</strong>, <strong>Ekspor PDF</strong>, atau <strong>Cetak Dokumen</strong> untuk mencetak laporan resmi tanpa elemet UI web.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kelompok Guide 1 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> 1. Cara Membuat Booking Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Masuk ke <strong>Dashboard Kelompok</strong> &rarr; klik <strong>+ Booking Baru</strong>:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Langkah 1: Pilih Hari & Tanggal.</li>
                <li>Langkah 2: Pilih Slot Waktu Istirahat.</li>
                <li>Langkah 3: Pilih Akang pendamping.</li>
                <li>Langkah 4: Pilih Teteh pendamping.</li>
                <li>Langkah 5: Cek Pratinjau Card & klik <strong>Submit Booking</strong>.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Kelompok Guide 2 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4 text-emerald-500" /> 2. Cara Mengganti Anggota Sementara
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Saat mengisi presensi hadir di form booking:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Jika ada anggota utama berhalangan hadir, centang opsi <strong>Pengganti Sementara</strong>.</li>
                <li>Tuliskan nama siswa/i pengganti sementara untuk keperluan presensi kelompok.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Kelompok Guide 3 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="size-4 text-blue-500" /> 3. Cara Melihat Progress Kating Met
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Buka menu <strong>Progress Saya</strong>:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Lihat progress bar target kelompok dan pencapaian individu setiap anggota.</li>
                <li>Cek daftar Kating yang telah berhasil ditemui beserta tanggal dan jamnya.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Kelompok Guide 4 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="size-4 text-emerald-600" /> 4. Cara Kirim Chat Konfirmasi WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Pada tabel Booking Kelompok Anda:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Klik ikon <strong>WhatsApp</strong> di samping nama Akang atau Teteh.</li>
                <li>Sistem akan otomatis mengarahkan ke WhatsApp dengan pesan template yang sudah terisi variabel kelompok Anda.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
