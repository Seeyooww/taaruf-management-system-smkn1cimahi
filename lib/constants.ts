import type { UserRole } from "@/types/auth";

export const APP_NAME = "Taaruf Management System";
export const APP_SHORT_NAME = "TMS";
export const APP_DESCRIPTION =
  "Platform internal SMKN 1 Cimahi untuk mengelola fondasi operasional acara Taaruf secara aman, rapi, dan modern.";

export const ANNOUNCEMENT_PLACEHOLDER =
  "Pengumuman resmi akan ditampilkan di sini pada fase berikutnya.";

export const COUNTDOWN_PLACEHOLDER = "00 Hari 00 Jam 00 Menit 00 Detik";

export const DASHBOARD_NAVIGATION: Record<
  UserRole,
  Array<{ href: string; label: string; description: string; category?: string }>
> = {
  admin: [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      description: "Ringkasan statistik dan aktivitas sistem.",
      category: "Utama",
    },
    {
      href: "/admin/booking",
      label: "Booking Kelompok",
      description: "Kelola & verifikasi permohonan booking sesi Taaruf.",
      category: "Operasional",
    },
    {
      href: "/admin/progress",
      label: "Monitoring Progress",
      description: "Pantau pencapaian progress kating per anggota.",
      category: "Operasional",
    },
    {
      href: "/admin/riwayat",
      label: "Riwayat Aktivitas",
      description: "Log audit transaksi dan aktivitas pengguna.",
      category: "Operasional",
    },
    {
      href: "/admin/laporan/kelompok",
      label: "Laporan Kelompok",
      description: "Rekapitulasi booking & progress rata-rata kelompok.",
      category: "Pelaporan",
    },
    {
      href: "/admin/laporan/anggota",
      label: "Laporan Anggota",
      description: "Rekapitulasi pencapaian & kating met per anggota.",
      category: "Pelaporan",
    },
    {
      href: "/admin/laporan/kating",
      label: "Laporan Kating",
      description: "Rekapitulasi ditaarufi & riwayat kating pendamping.",
      category: "Pelaporan",
    },
    {
      href: "/admin/laporan/lpj",
      label: "Rekap LPJ (Akhir Acara)",
      description: "Laporan pertanggungjawaban & statistik resmi acara.",
      category: "Pelaporan",
    },
    {
      href: "/admin/kelompok",
      label: "Data Kelompok",
      description: "Manajemen data kelompok Taaruf.",
      category: "Master Data",
    },
    {
      href: "/admin/anggota",
      label: "Data Anggota",
      description: "Manajemen data anggota peserta per kelompok.",
      category: "Master Data",
    },
    {
      href: "/admin/kating",
      label: "Data Kating",
      description: "Manajemen data Kakak Tingkat pendamping.",
      category: "Master Data",
    },
    {
      href: "/admin/pengaturan/acara",
      label: "Pengaturan Acara",
      description: "Pengaturan jadwal, nama acara, dan kriteria.",
      category: "Pengaturan",
    },
    {
      href: "/admin/pengaturan/slot",
      label: "Slot Waktu",
      description: "Pengaturan slot jam istirahat & kegiatan.",
      category: "Pengaturan",
    },
    {
      href: "/admin/pengaturan/whatsapp",
      label: "Template WhatsApp",
      description: "Manajemen format pesan dan live preview.",
      category: "Pengaturan",
    },
    {
      href: "/admin/pengaturan/pengumuman",
      label: "Pengumuman",
      description: "Kelola pengumuman resmi untuk landing page & dashboard.",
      category: "Pengaturan",
    },
    {
      href: "/admin/pengaturan/backup",
      label: "Backup & Restore",
      description: "Cadangkan & pulihkan database ke format JSON.",
      category: "Pengaturan",
    },
    {
      href: "/admin/panduan",
      label: "Panduan System",
      description: "Petunjuk operasional Admin & Kelompok.",
      category: "Bantuan & Info",
    },
    {
      href: "/admin/tentang",
      label: "Tentang Aplikasi",
      description: "Informasi aplikasi, versi, dan pengembang.",
      category: "Bantuan & Info",
    },
  ],
  kelompok: [
    {
      href: "/kelompok/dashboard",
      label: "Dashboard",
      description: "Beranda kelompok untuk memantau aktivitas Taaruf.",
      category: "Utama",
    },
    {
      href: "/kelompok/booking",
      label: "Booking Saya",
      description: "Pengajuan dan riwayat jadwal sesi Taaruf.",
      category: "Operasional",
    },
    {
      href: "/kelompok/progress",
      label: "Progress Anggota",
      description: "Pantau persentase pencapaian kating per anggota.",
      category: "Operasional",
    },
    {
      href: "/admin/panduan",
      label: "Panduan Kelompok",
      description: "Petunjuk cara booking & penggunaan sistem.",
      category: "Bantuan & Info",
    },
    {
      href: "/admin/tentang",
      label: "Tentang Aplikasi",
      description: "Informasi aplikasi dan pengembang.",
      category: "Bantuan & Info",
    },
  ],
};

export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "admin12345";
