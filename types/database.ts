export type Gender = "L" | "P";

/** Info ringkas satu kating yang terlampir pada booking */
export interface KatingBasic {
  id: string;
  nama: string;
  jenis_kelamin: Gender;
  nomor_whatsapp: string;
  contacted?: boolean;
  contacted_at?: string | null;
}

/** Compact booking entry used for calendar availability calculations */
export interface CalendarBookingEntry {
  tanggal: string;
  slot_id: string;
  /** Array semua kating_id yang terlibat dalam booking ini */
  kating_ids: string[];
  status: string;
}

export interface Kelompok {
  id: string;
  nomor_kelompok: number;
  kelas: string;
  username: string;
  password_hint?: string | null;
  created_at: string;
  total_anggota?: number;
}

export interface Anggota {
  id: string;
  kelompok_id: string;
  nama: string;
  jenis_kelamin: Gender;
  aktif: boolean;
  created_at: string;
  kelompok_nama?: string;
}

export interface Kating {
  id: string;
  nama: string;
  kelas: string;
  jenis_kelamin: Gender;
  nomor_whatsapp: string;
  aktif: boolean;
  created_at: string;
}

/** Tabel relasi booking ↔ kating (many-to-many) */
export interface BookingKating {
  id: string;
  booking_id: string;
  kating_id: string;
  contacted: boolean;
  contacted_at?: string | null;
}

export type BookingStatus =
  | "Draft"
  | "Menunggu Konfirmasi"
  | "Disetujui"
  | "Ditolak"
  | "Selesai"
  | "Tidak Dihitung"
  | "Dibatalkan";

export interface Booking {
  id: string;
  kelompok_id: string;
  tanggal: string;
  slot_id: string;
  status: BookingStatus;
  catatan?: string | null;
  jam_pulang?: string | null;
  tempat_taaruf?: string | null;
  created_at: string;
}

export interface BookingWithDetails extends Booking {
  kelompok_nama?: string;
  slot_nama?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  /** Daftar semua kating yang terlibat dalam booking ini */
  kating_list: KatingBasic[];
}

export interface BookingParticipant {
  id: string;
  booking_id: string;
  anggota_id: string;
  hadir: boolean;
  is_substitute: boolean;              // true jika peserta ini pengganti dari kelompok lain
  replaces_anggota_id: string | null;  // ID anggota asli yang digantikan
}

/** Satu pasangan substitusi: pengganti → yang digantikan */
export interface SubstituteEntry {
  substituteId: string;  // ID Fajar (pengganti)
  replacesId: string;    // ID Eka (yang digantikan)
}

export interface ProgressRecord {
  id: string;
  anggota_id: string;
  booking_id: string;
  kating_id: string;
  created_at: string;
}

export interface EventSettings {
  id?: string;
  nama_acara: string;
  tahun: number;
  target_kating: number;
  minimal_durasi: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  locked_event?: boolean;
  updated_at?: string;
}

export interface SlotWaktu {
  id: string;
  nama_slot: string;
  jam_mulai: string;
  jam_selesai: string;
  urutan: number;
  aktif: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  nama_template: string;
  isi_template: string;
  created_at?: string;
}

export interface Announcement {
  id: string;
  judul: string;
  isi: string;
  aktif: boolean;
  created_at: string;
}

export interface SystemStats {
  totalKelompok: number;
  totalAnggota: number;
  totalKating: number;
  bookingHariIni: number;
  progressKeseluruhan: number;
  anggotaMencapaiTarget: number;
}

export interface MetKatingDetail {
  kating_id: string;
  kating_nama: string;
  jenis_kelamin: Gender;
  tanggal: string;
  slot_nama: string;
}

export interface SubstitutionRecord {
  booking_id: string;
  tanggal: string;
  slot_nama: string;
  /** Jika anggota ini adalah PENGGANTI: nama yang digantikan */
  replaces_nama?: string;
  /** Jika anggota ini DIGANTIKAN: nama penggantinya */
  replaced_by_nama?: string;
}

export interface AnggotaProgressSummary {
  anggota_id: string;
  nama: string;
  jenis_kelamin: Gender;
  kelompok_id: string;
  kelompok_nama: string;
  kelas: string;
  total_kating_met: number;
  target_kating: number;
  percentage: number;
  status_label: "Selesai" | "Hampir Selesai" | "Belum";
  status_color: "success" | "warning" | "destructive";
  kating_met_list: MetKatingDetail[];
  substitution_history?: SubstitutionRecord[];
}
