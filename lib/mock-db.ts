import type {
  Anggota,
  AnggotaProgressSummary,
  Announcement,
  BookingParticipant,
  BookingStatus,
  BookingWithDetails,
  ChangelogCategory,
  EventSettings,
  Gender,
  Kating,
  Kelompok,
  MetKatingDetail,
  ProgressRecord,
  SlotWaktu,
  SystemChangelog,
  SystemVersion,
  WhatsAppTemplate,
} from "@/types/database";

export type { BookingWithDetails };

// In-Memory Seed Data State
let mockSettings: EventSettings = {
  id: "setting-1",
  nama_acara: "Taaruf SMKN 1 Cimahi 2026",
  tahun: 2026,
  target_kating: 5,
  minimal_durasi: 30,
  tanggal_mulai: "2026-08-01",
  tanggal_selesai: "2026-08-07",
  locked_event: false,
  updated_at: new Date().toISOString(),
};

let mockKelompokList: Kelompok[] = [];

let mockAnggotaList: Anggota[] = [];

let mockKatingList: Kating[] = [];

let mockSlotList: SlotWaktu[] = [
  { id: "slot-1", nama_slot: "Istirahat 1", jam_mulai: "09:30", jam_selesai: "10:00", urutan: 1, aktif: true },
  { id: "slot-2", nama_slot: "Istirahat 2", jam_mulai: "12:00", jam_selesai: "12:45", urutan: 2, aktif: true },
  { id: "slot-3", nama_slot: "Istirahat 3", jam_mulai: "15:15", jam_selesai: "15:45", urutan: 3, aktif: true },
  { id: "slot-4", nama_slot: "Pulang", jam_mulai: "16:00", jam_selesai: "16:30", urutan: 4, aktif: true },
];

let mockWATemplates: WhatsAppTemplate[] = [
  {
    id: "wa-1",
    nama_template: "Konfirmasi Booking Sesi",
    isi_template: "Halo Akang {{akang}} & Teteh {{teteh}}, kami dari {{kelompok}} mengajukan sesi Taaruf pada hari {{hari}}, slot {{slot}}. Mohon konfirmasinya. Terima kasih!",
    created_at: "2026-07-30T08:00:00Z",
  },
  {
    id: "wa-2",
    nama_template: "Pengingat Jadwal",
    isi_template: "Pengingat sesi Taaruf untuk {{kelompok}} bersama Akang {{akang}} & Teteh {{teteh}} pada hari {{hari}} slot {{slot}}. Mohon hadir tepat waktu.",
    created_at: "2026-07-30T08:05:00Z",
  },
];

let mockAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    judul: "Selamat Datang Peserta Taaruf 2026",
    isi: "Jadwal sesi Taaruf akan segera dibuka. Harap perhatikan informasi dari pembimbing kelompok masing-masing.",
    aktif: true,
    created_at: "2026-07-30T08:00:00Z",
  },
  {
    id: "ann-2",
    judul: "Tata Tertib Pelaksanaan Taaruf",
    isi: "Seluruh anggota kelompok wajib mengikuti tata tertib, hadir tepat waktu, dan berlaku sopan selama sesi berlangsung.",
    aktif: true,
    created_at: "2026-07-30T08:10:00Z",
  },
];

let mockBookingList: BookingWithDetails[] = [];

let mockBookingParticipantsList: BookingParticipant[] = [];

let mockProgressList: ProgressRecord[] = [];

const mockVersions: SystemVersion[] = [
  {
    id: "ver-1",
    version: "v1.4.2",
    build: "20260808",
    release_date: "8 Agustus 2026",
    status: "Stable",
    current: true,
    created_at: "2026-08-08T08:00:00Z",
  },
  {
    id: "ver-2",
    version: "v1.4.1",
    build: "20260805",
    release_date: "5 Agustus 2026",
    status: "Stable",
    current: false,
    created_at: "2026-08-05T08:00:00Z",
  },
  {
    id: "ver-3",
    version: "v1.4.0",
    build: "20260801",
    release_date: "1 Agustus 2026",
    status: "Stable",
    current: false,
    created_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "ver-4",
    version: "v1.3.2",
    build: "20260725",
    release_date: "25 Juli 2026",
    status: "Stable",
    current: false,
    created_at: "2026-07-25T08:00:00Z",
  },
  {
    id: "ver-5",
    version: "v1.3.0",
    build: "20260715",
    release_date: "15 Juli 2026",
    status: "Stable",
    current: false,
    created_at: "2026-07-15T08:00:00Z",
  },
];

let mockChangelogs: SystemChangelog[] = [
  {
    id: "cl-1",
    version_id: "ver-1",
    version: "v1.4.2",
    category: "FEATURE",
    title: "Dashboard Enterprise Command Center",
    description: "Dashboard admin baru dengan situational awareness, status sistem live, dan visual hierarchy modern.",
    important: true,
    order_index: 1,
    created_at: "2026-08-08T08:00:00Z",
  },
  {
    id: "cl-2",
    version_id: "ver-1",
    version: "v1.4.2",
    category: "FEATURE",
    title: "Insight Hari Ini & Today Summary",
    description: "Panel otomatis yang mengekstrak insight krusial dan ringkasan operasional harian.",
    important: false,
    order_index: 2,
    created_at: "2026-08-08T08:00:00Z",
  },
  {
    id: "cl-3",
    version_id: "ver-1",
    version: "v1.4.2",
    category: "FEATURE",
    title: "Quick Actions & System Status Panel",
    description: "Akses cepat ke 6 fungsi utama admin dan indikator kesehatan koneksi database/server realtime.",
    important: false,
    order_index: 3,
    created_at: "2026-08-08T08:00:00Z",
  },
  {
    id: "cl-4",
    version_id: "ver-1",
    version: "v1.4.2",
    category: "IMPROVEMENT",
    title: "Leaderboard & Analytics Response Time",
    description: "Optimasi kueri dan pagination postgrest untuk performa ekstra cepat.",
    important: false,
    order_index: 4,
    created_at: "2026-08-08T08:00:00Z",
  },
  {
    id: "cl-5",
    version_id: "ver-1",
    version: "v1.4.2",
    category: "BUGFIX",
    title: "Fixed Leaderboard Pagination (>1000 Progress Rows)",
    description: "Memperbaiki pemotongan data progress pada tabel > 1000 baris menggunakan chunked range fetching.",
    important: true,
    order_index: 5,
    created_at: "2026-08-08T08:00:00Z",
  },
  {
    id: "cl-6",
    version_id: "ver-1",
    version: "v1.4.2",
    category: "BUGFIX",
    title: "Fixed Booking Slot Auto Change",
    description: "Menghapus fallback || slotList[0] berbahaya dan menjaga immutability slot_id booking.",
    important: true,
    order_index: 6,
    created_at: "2026-08-08T08:00:00Z",
  },
  {
    id: "cl-7",
    version_id: "ver-1",
    version: "v1.4.2",
    category: "BUGFIX",
    title: "Fixed Completed_at Synchronization",
    description: "Menyingkronkan timestamp kelulusan target kating antara anggota dan kelompok secara akurat.",
    important: false,
    order_index: 7,
    created_at: "2026-08-08T08:00:00Z",
  },
  {
    id: "cl-8",
    version_id: "ver-2",
    version: "v1.4.1",
    category: "FEATURE",
    title: "Fitur Substitusi Anggota Pengganti",
    description: "Memungkinkan anggota luar kelompok menggantikan anggota yang berhalangan hadir secara fleksibel.",
    important: true,
    order_index: 1,
    created_at: "2026-08-05T08:00:00Z",
  },
  {
    id: "cl-9",
    version_id: "ver-2",
    version: "v1.4.1",
    category: "IMPROVEMENT",
    title: "Multi-Kating Pendamping per Sesi",
    description: "Dukungan hingga 2 kating pendamping dalam satu sesi Taaruf.",
    important: false,
    order_index: 2,
    created_at: "2026-08-05T08:00:00Z",
  },
  {
    id: "cl-10",
    version_id: "ver-3",
    version: "v1.4.0",
    category: "FEATURE",
    title: "Sistem Peringkat Leaderboard Individu & Kelompok",
    description: "Tampilan visual real-time peringkat kelompok terbaik & individu peserta.",
    important: true,
    order_index: 1,
    created_at: "2026-08-01T08:00:00Z",
  },
];

export function getMockVersions(): SystemVersion[] {
  return mockVersions.map((v) => ({
    ...v,
    changelogs: mockChangelogs.filter((c) => c.version === v.version || c.version_id === v.id),
  }));
}

export function getMockCurrentVersion(): SystemVersion {
  const versions = getMockVersions();
  return versions.find((v) => v.current) || versions[0];
}

export function saveMockVersion(data: Partial<SystemVersion>) {
  if (!data.version) throw new Error("Versi harus diisi.");
  const newVer: SystemVersion = {
    id: `ver-${Date.now()}`,
    version: data.version,
    build: data.build || new Date().toISOString().split("T")[0].replace(/-/g, ""),
    release_date: data.release_date || "Hari Ini",
    status: data.status || "Stable",
    current: data.current || false,
    created_at: new Date().toISOString(),
    changelogs: [],
  };

  if (newVer.current) {
    mockVersions.forEach((v) => (v.current = false));
  }

  mockVersions.unshift(newVer);
  return newVer;
}

export function setMockCurrentVersion(versionId: string) {
  mockVersions.forEach((v) => {
    v.current = v.id === versionId || v.version === versionId;
  });
  return getMockCurrentVersion();
}

export function addMockChangelog(data: Partial<SystemChangelog>) {
  if (!data.version || !data.title || !data.category) {
    throw new Error("Parameter changelog tidak lengkap.");
  }
  const verObj = mockVersions.find((v) => v.version === data.version || v.id === data.version_id);
  const newCl: SystemChangelog = {
    id: `cl-${Date.now()}`,
    version_id: verObj?.id,
    version: data.version,
    category: data.category as ChangelogCategory,
    title: data.title,
    description: data.description || "",
    important: data.important || false,
    order_index: (mockChangelogs.filter((c) => c.version === data.version).length) + 1,
    created_at: new Date().toISOString(),
  };
  mockChangelogs.push(newCl);
  return newCl;
}

export function deleteMockChangelog(id: string) {
  mockChangelogs = mockChangelogs.filter((c) => c.id !== id);
  return true;
}


// GETTERS & WRITERS

export function getMockSettings(): EventSettings {
  return { ...mockSettings };
}

export function updateMockSettings(data: Partial<EventSettings>) {
  mockSettings = {
    ...mockSettings,
    ...data,
    updated_at: new Date().toISOString(),
  };
  return mockSettings;
}

export function toggleLockEvent(locked: boolean) {
  mockSettings.locked_event = locked;
  mockSettings.updated_at = new Date().toISOString();
  return mockSettings;
}

export function isEventLocked(): boolean {
  return Boolean(mockSettings.locked_event);
}

export function getMockKelompokList() {
  return mockKelompokList.map((k) => ({
    ...k,
    total_anggota: mockAnggotaList.filter((a) => a.kelompok_id === k.id).length,
  }));
}

export function saveMockKelompok(data: { nomor_kelompok: number; kelas: string; username: string }) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  const existing = mockKelompokList.find((k) => k.nomor_kelompok === data.nomor_kelompok);
  if (existing) {
    existing.kelas = data.kelas;
    existing.username = data.username;
    return existing;
  }
  const newItem: Kelompok = {
    id: `kel-${Date.now()}`,
    nomor_kelompok: Number(data.nomor_kelompok),
    kelas: data.kelas,
    username: data.username.toLowerCase().trim(),
    created_at: new Date().toISOString(),
  };
  mockKelompokList.push(newItem);
  return newItem;
}

export function deleteMockKelompok(id: string) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  mockKelompokList = mockKelompokList.filter((k) => k.id !== id);
  mockAnggotaList = mockAnggotaList.filter((a) => a.kelompok_id !== id);
}

export function getMockAnggotaList() {
  return mockAnggotaList.map((a) => {
    const k = mockKelompokList.find((kel) => kel.id === a.kelompok_id);
    return {
      ...a,
      kelompok_nama: k ? `Kelompok ${k.nomor_kelompok} (${k.kelas})` : "Tidak Diketahui",
    };
  });
}

export function saveMockAnggota(data: {
  id?: string;
  kelompok_id: string;
  nama: string;
  jenis_kelamin: "L" | "P";
  aktif: boolean;
}) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  if (data.id) {
    const idx = mockAnggotaList.findIndex((a) => a.id === data.id);
    if (idx !== -1) {
      mockAnggotaList[idx] = { ...mockAnggotaList[idx], ...data };
      return mockAnggotaList[idx];
    }
  }
  const newItem: Anggota = {
    id: `ang-${Date.now()}`,
    kelompok_id: data.kelompok_id,
    nama: data.nama,
    jenis_kelamin: data.jenis_kelamin,
    aktif: Boolean(data.aktif),
    created_at: new Date().toISOString(),
  };
  mockAnggotaList.push(newItem);
  return newItem;
}

export function deleteMockAnggota(id: string) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  mockAnggotaList = mockAnggotaList.filter((a) => a.id !== id);
}

export function getMockKatingList() {
  return [...mockKatingList];
}

export function saveMockKating(data: {
  id?: string;
  nama: string;
  kelas: string;
  jenis_kelamin: "L" | "P";
  nomor_whatsapp: string;
  aktif: boolean;
}) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  if (data.id) {
    const idx = mockKatingList.findIndex((k) => k.id === data.id);
    if (idx !== -1) {
      mockKatingList[idx] = { ...mockKatingList[idx], ...data };
      return mockKatingList[idx];
    }
  }
  const newItem: Kating = {
    id: `kat-${Date.now()}`,
    nama: data.nama,
    kelas: data.kelas,
    jenis_kelamin: data.jenis_kelamin,
    nomor_whatsapp: data.nomor_whatsapp,
    aktif: Boolean(data.aktif),
    created_at: new Date().toISOString(),
  };
  mockKatingList.push(newItem);
  return newItem;
}

export function deleteMockKating(id: string) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  mockKatingList = mockKatingList.filter((k) => k.id !== id);
}

export function getMockSlotList() {
  return [...mockSlotList].sort((a, b) => a.urutan - b.urutan);
}

export function saveMockSlot(data: {
  id?: string;
  nama_slot: string;
  jam_mulai: string;
  jam_selesai: string;
  urutan: number;
  aktif: boolean;
}) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  if (data.id) {
    const idx = mockSlotList.findIndex((s) => s.id === data.id);
    if (idx !== -1) {
      mockSlotList[idx] = { ...mockSlotList[idx], ...data };
      return mockSlotList[idx];
    }
  }
  const newItem: SlotWaktu = {
    id: `slot-${Date.now()}`,
    nama_slot: data.nama_slot,
    jam_mulai: data.jam_mulai,
    jam_selesai: data.jam_selesai,
    urutan: Number(data.urutan),
    aktif: Boolean(data.aktif),
  };
  mockSlotList.push(newItem);
  return newItem;
}

export function deleteMockSlot(id: string) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  mockSlotList = mockSlotList.filter((s) => s.id !== id);
}

export function getMockWATemplates() {
  return [...mockWATemplates];
}

export function saveMockWATemplate(data: { id?: string; nama_template: string; isi_template: string }) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  if (data.id) {
    const idx = mockWATemplates.findIndex((w) => w.id === data.id);
    if (idx !== -1) {
      mockWATemplates[idx] = { ...mockWATemplates[idx], ...data };
      return mockWATemplates[idx];
    }
  }
  const newItem: WhatsAppTemplate = {
    id: `wa-${Date.now()}`,
    nama_template: data.nama_template,
    isi_template: data.isi_template,
    created_at: new Date().toISOString(),
  };
  mockWATemplates.push(newItem);
  return newItem;
}

export function deleteMockWATemplate(id: string) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  mockWATemplates = mockWATemplates.filter((w) => w.id !== id);
}

export function getMockAnnouncements() {
  return [...mockAnnouncements].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function saveMockAnnouncement(data: { id?: string; judul: string; isi: string; aktif: boolean }) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  if (data.id) {
    const idx = mockAnnouncements.findIndex((a) => a.id === data.id);
    if (idx !== -1) {
      mockAnnouncements[idx] = { ...mockAnnouncements[idx], ...data };
      return mockAnnouncements[idx];
    }
  }
  const newItem: Announcement = {
    id: `ann-${Date.now()}`,
    judul: data.judul,
    isi: data.isi,
    aktif: Boolean(data.aktif),
    created_at: new Date().toISOString(),
  };
  mockAnnouncements.push(newItem);
  return newItem;
}

export function deleteMockAnnouncement(id: string) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan data tidak diizinkan.");
  }
  mockAnnouncements = mockAnnouncements.filter((a) => a.id !== id);
}

export function getMockBookingList(kelompokId?: string): BookingWithDetails[] {
  let list = mockBookingList;
  if (kelompokId) {
    list = list.filter((b) => b.kelompok_id === kelompokId);
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getAvailableKatingList(tanggal: string, slot_id: string): Kating[] {
  const activeKating = mockKatingList.filter((k) => k.aktif);
  const busyBooking = mockBookingList.filter(
    (b) => b.tanggal === tanggal && b.slot_id === slot_id && b.status !== "Ditolak" && b.status !== "Dibatalkan"
  );
  const busyKatingIds = new Set<string>();
  busyBooking.forEach((b) => {
    (b.kating_list ?? []).forEach((k) => busyKatingIds.add(k.id));
  });
  return activeKating.filter((k) => !busyKatingIds.has(k.id));
}

export function deleteMockBooking(id: string): void {
  mockBookingList = mockBookingList.filter((b) => b.id !== id);
}

/**
 * STRICT BACKEND VALIDATED BOOKING CREATION
 */
export function createMockBooking(data: {
  kelompok_id: string;
  tanggal: string;
  slot_id: string;
  kating_ids: string[];
  catatan?: string;
  jam_pulang?: string | null;
  tempat_taaruf?: string | null;
}) {
  // 1. Check Event Lock
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci oleh Admin. Booking baru tidak dapat dibuat.");
  }

  // 2. Check at least one kating selected
  if (!data.kating_ids || data.kating_ids.length === 0) {
    throw new Error("Booking wajib memilih minimal satu kating pendamping.");
  }

  // 3. Validate all selected kating exist and are available
  const busyBookings = mockBookingList.filter(
    (b) =>
      b.tanggal === data.tanggal &&
      b.slot_id === data.slot_id &&
      b.status !== "Ditolak" &&
      b.status !== "Dibatalkan"
  );
  const busyKatingIds = new Set<string>();
  busyBookings.forEach((b) => {
    (b.kating_list ?? []).forEach((k) => busyKatingIds.add(k.id));
  });

  const conflictIds = data.kating_ids.filter((id) => busyKatingIds.has(id));
  if (conflictIds.length > 0) {
    throw new Error(`Satu atau lebih kating yang dipilih sudah di-booking pada slot ini.`);
  }

  const k = mockKelompokList.find((kel) => kel.id === data.kelompok_id || kel.username === data.kelompok_id);
  const s = mockSlotList.find((slot) => slot.id === data.slot_id);

  const kating_list = data.kating_ids.map((kid) => {
    const kat = mockKatingList.find((k) => k.id === kid);
    return {
      id: kid,
      nama: kat ? kat.nama : "Kating",
      jenis_kelamin: kat ? kat.jenis_kelamin : ("L" as Gender),
      nomor_whatsapp: kat ? kat.nomor_whatsapp : "",
      contacted: false,
      contacted_at: null,
    };
  });

  const newBooking: BookingWithDetails = {
    id: `book-${Date.now()}`,
    kelompok_id: k?.id || data.kelompok_id,
    tanggal: data.tanggal,
    slot_id: data.slot_id,
    status: "Menunggu Konfirmasi",
    catatan: data.catatan || null,
    jam_pulang: data.jam_pulang || null,
    tempat_taaruf: data.tempat_taaruf || null,
    created_at: new Date().toISOString(),
    kelompok_nama: k ? `Kelompok ${k.nomor_kelompok} (${k.kelas})` : "Kelompok",
    slot_nama: s ? s.nama_slot : "Slot",
    jam_mulai: s ? s.jam_mulai : "00:00",
    jam_selesai: s ? s.jam_selesai : "00:00",
    kating_list,
  };

  mockBookingList.unshift(newBooking);
  return newBooking;
}

export function updateMockBookingStatus(id: string, status: BookingStatus) {
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci. Perubahan status booking tidak diizinkan.");
  }
  const idx = mockBookingList.findIndex((b) => b.id === id);
  if (idx !== -1) {
    mockBookingList[idx].status = status;
    return mockBookingList[idx];
  }
  return null;
}

export function updateMockBookingContactedStatus(id: string, kating_id: string) {
  const idx = mockBookingList.findIndex((b) => b.id === id);
  if (idx !== -1) {
    const timeStr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";

    const kating = mockBookingList[idx].kating_list?.find((k) => k.id === kating_id);
    if (kating) {
      kating.contacted = true;
      kating.contacted_at = timeStr;
    }
    return mockBookingList[idx];
  }
  return null;
}

/**
 * STRICT BACKEND VALIDATED ATTENDANCE & PROGRESS ENGINE
 */
export function saveMockBookingProgress(bookingId: string, presentAnggotaIds: string[]) {
  if (isEventLocked()) {
    return { success: false, message: "Acara sedang dikunci. Progress tidak dapat diubah." };
  }

  const booking = mockBookingList.find((b) => b.id === bookingId);
  if (!booking) return { success: false, message: "Booking tidak ditemukan." };

  // Rule: Minimum 3 present members required for group session completion
  if (presentAnggotaIds.length < 3) {
    return {
      success: false,
      message: "Gagal menghitung progress: Diperlukan minimal 3 anggota hadir untuk menyelesaikan sesi kelompok.",
    };
  }

  booking.status = "Selesai";
  const katingIds = (booking.kating_list ?? []).map((k) => k.id).filter(Boolean);
  let newProgressCount = 0;

  presentAnggotaIds.forEach((anggotaId) => {
    mockBookingParticipantsList.push({
      id: `part-${Date.now()}-${Math.random()}`,
      booking_id: bookingId,
      anggota_id: anggotaId,
      hadir: true,
      is_substitute: false,
      replaces_anggota_id: null,
    });

    katingIds.forEach((katingId) => {
      const alreadyMet = mockProgressList.some(
        (p) => p.anggota_id === anggotaId && p.kating_id === katingId
      );

      if (!alreadyMet) {
        mockProgressList.push({
          id: `prog-${Date.now()}-${Math.random()}`,
          anggota_id: anggotaId,
          booking_id: bookingId,
          kating_id: katingId,
          created_at: new Date().toISOString(),
        });
        newProgressCount++;
      }
    });
  });

  // Check & set completed_at for Anggota & Kelompok if targets reached for the first time
  const nowIso = new Date().toISOString();
  const targetKating = mockSettings.target_kating || 5;

  presentAnggotaIds.forEach((anggotaId) => {
    const ang = mockAnggotaList.find((a) => a.id === anggotaId);
    if (ang && !ang.completed_at) {
      const metCount = mockProgressList.filter((p) => p.anggota_id === anggotaId).length;
      if (metCount >= targetKating) {
        ang.completed_at = nowIso;
      }
    }
  });

  if (booking.kelompok_id) {
    const kel = mockKelompokList.find((k) => k.id === booking.kelompok_id);
    if (kel && !kel.completed_at) {
      const groupAnggota = mockAnggotaList.filter((a) => a.kelompok_id === kel.id && a.aktif);
      const allDone =
        groupAnggota.length > 0 &&
        groupAnggota.every((a) => {
          const metCount = mockProgressList.filter((p) => p.anggota_id === a.id).length;
          return metCount >= targetKating;
        });

      if (allDone) {
        kel.completed_at = nowIso;
      }
    }
  }

  return {
    success: true,
    message: `Progress berhasil dihitung! ${presentAnggotaIds.length} anggota hadir mendapatkan penambahan progress (${newProgressCount} entri baru).`,
  };
}

export function getMockAnggotaProgressSummaries(
  targetKating: number = mockSettings.target_kating,
  kelompokFilterId?: string
): AnggotaProgressSummary[] {
  let anggotaList = mockAnggotaList;

  if (kelompokFilterId) {
    anggotaList = anggotaList.filter((a) => a.kelompok_id === kelompokFilterId);
  }

  return anggotaList.map((a) => {
    const kObj = mockKelompokList.find((k) => k.id === a.kelompok_id);
    const kName = kObj ? `Kelompok ${kObj.nomor_kelompok}` : "Tidak Diketahui";
    const kKelas = kObj ? kObj.kelas : "-";

    const myProgressRecords = mockProgressList.filter((p) => p.anggota_id === a.id);

    const metList: MetKatingDetail[] = myProgressRecords.map((p) => {
      const kating = mockKatingList.find((kat) => kat.id === p.kating_id);
      const booking = mockBookingList.find((b) => b.id === p.booking_id);
      const slot = mockSlotList.find((s) => s.id === booking?.slot_id);

      return {
        kating_id: p.kating_id,
        kating_nama: kating ? kating.nama : "Kating",
        jenis_kelamin: kating ? kating.jenis_kelamin : "L",
        tanggal: booking ? booking.tanggal : p.created_at.split("T")[0],
        slot_nama: slot ? slot.nama_slot : "Sesi Taaruf",
        booking_id: p.booking_id,
      };
    });

    const metCount = metList.length;
    const percentage = Math.min(Math.round((metCount / targetKating) * 100), 100);

    let status_label: AnggotaProgressSummary["status_label"] = "Belum";
    let status_color: AnggotaProgressSummary["status_color"] = "destructive";

    if (metCount >= targetKating) {
      status_label = "Selesai";
      status_color = "success";
    } else if (percentage >= 50) {
      status_label = "Hampir Selesai";
      status_color = "warning";
    }

    return {
      anggota_id: a.id,
      nama: a.nama,
      jenis_kelamin: a.jenis_kelamin,
      kelompok_id: a.kelompok_id,
      kelompok_nama: kName,
      kelas: kKelas,
      total_kating_met: metCount,
      target_kating: targetKating,
      percentage,
      status_label,
      status_color,
      kating_met_list: metList,
    };
  });
}

/**
 * PHASE 6: SEEDER & SIMULATION ENGINE
 */

export function seedMockDummyData() {
  // Generate 30 Kelompok
  const newKelompok: Kelompok[] = [];
  const newAnggota: Anggota[] = [];

  const jurusanList = ["SIJA", "RPL", "TKJ", "TEI", "TFLM"];

  for (let i = 1; i <= 30; i++) {
    const kId = `kel-dummy-${i}`;
    const jur = jurusanList[(i - 1) % jurusanList.length];
    const kelasNum = (i % 2) + 1;
    const kelasStr = `X ${jur} ${kelasNum}`;

    newKelompok.push({
      id: kId,
      nomor_kelompok: i,
      kelas: kelasStr,
      username: `kelompok${i}`,
      created_at: new Date().toISOString(),
    });

    // 3-4 anggota per kelompok = 110 total anggota
    const anggotaCount = i <= 20 ? 4 : 3;
    for (let a = 1; a <= anggotaCount; a++) {
      const g: Gender = (a + i) % 2 === 0 ? "L" : "P";
      const namePrefix = g === "L" ? ["Daffa", "Budi", "Rizky", "Fajar", "Aditya", "Gilang", "Rafi"] : ["Siti", "Dewi", "Rina", "Nabila", "Zahra", "Maya", "Putri"];
      const randName = `${namePrefix[(a + i) % namePrefix.length]} ${jur} ${i}-${a}`;

      newAnggota.push({
        id: `ang-dummy-${i}-${a}`,
        kelompok_id: kId,
        nama: randName,
        jenis_kelamin: g,
        aktif: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Generate 108 Kating (54 Akang L & 54 Teteh P)
  const newKating: Kating[] = [];
  for (let k = 1; k <= 108; k++) {
    const g: Gender = k <= 54 ? "L" : "P";
    const prefix = g === "L" ? "Akang" : "Teteh";
    const jur = jurusanList[(k - 1) % jurusanList.length];
    const kelasStr = `XII ${jur} ${(k % 2) + 1}`;

    newKating.push({
      id: `kat-dummy-${k}`,
      nama: `${prefix} Senior ${jur} ${k}`,
      kelas: kelasStr,
      jenis_kelamin: g,
      nomor_whatsapp: `081234567${String(k).padStart(3, "0")}`,
      aktif: true,
      created_at: new Date().toISOString(),
    });
  }

  mockKelompokList = newKelompok;
  mockAnggotaList = newAnggota;
  mockKatingList = newKating;

  return {
    kelompokCount: mockKelompokList.length,
    anggotaCount: mockAnggotaList.length,
    katingCount: mockKatingList.length,
  };
}

export function resetMockDummyData() {
  mockKelompokList = [
    { id: "kel-1", nomor_kelompok: 1, kelas: "X SIJA 1", username: "kelompok1", created_at: "2026-07-30T10:00:00Z" },
    { id: "kel-2", nomor_kelompok: 2, kelas: "X SIJA 2", username: "kelompok2", created_at: "2026-07-30T10:05:00Z" },
    { id: "kel-3", nomor_kelompok: 3, kelas: "X RPL 1", username: "kelompok3", created_at: "2026-07-30T10:10:00Z" },
  ];

  mockAnggotaList = [
    { id: "ang-1", kelompok_id: "kel-1", nama: "Ahmad Fauzi", jenis_kelamin: "L", aktif: true, created_at: "2026-07-30T10:00:00Z" },
    { id: "ang-2", kelompok_id: "kel-1", nama: "Siti Rahmawati", jenis_kelamin: "P", aktif: true, created_at: "2026-07-30T10:01:00Z" },
    { id: "ang-3", kelompok_id: "kel-2", nama: "Budi Santoso", jenis_kelamin: "L", aktif: true, created_at: "2026-07-30T10:05:00Z" },
    { id: "ang-4", kelompok_id: "kel-2", nama: "Dewi Lestari", jenis_kelamin: "P", aktif: true, created_at: "2026-07-30T10:06:00Z" },
    { id: "ang-5", kelompok_id: "kel-3", nama: "Rizky Pratama", jenis_kelamin: "L", aktif: true, created_at: "2026-07-30T10:10:00Z" },
  ];

  mockKatingList = [
    { id: "kat-1", nama: "Akang Fikri Haikal", kelas: "XII SIJA 1", jenis_kelamin: "L", nomor_whatsapp: "081234567890", aktif: true, created_at: "2026-07-30T09:00:00Z" },
    { id: "kat-2", nama: "Teteh Anisa Fitri", kelas: "XII RPL 2", jenis_kelamin: "P", nomor_whatsapp: "081987654321", aktif: true, created_at: "2026-07-30T09:05:00Z" },
    { id: "kat-3", nama: "Akang Dimas Setiawan", kelas: "XI SIJA 2", jenis_kelamin: "L", nomor_whatsapp: "085712345678", aktif: true, created_at: "2026-07-30T09:10:00Z" },
    { id: "kat-4", nama: "Teteh Nurul Aini", kelas: "XI TKJ 1", jenis_kelamin: "P", nomor_whatsapp: "082134567890", aktif: true, created_at: "2026-07-30T09:15:00Z" },
  ];

  mockBookingList = [];
  mockBookingParticipantsList = [];
  mockProgressList = [];

  return { success: true, message: "Semua dummy data telah direset ke kondisi awal." };
}

export function simulateDayOneEvent() {
  // Ensure seeder data is active first
  seedMockDummyData();

  const akangs = mockKatingList.filter((k) => k.jenis_kelamin === "L");
  const tetehs = mockKatingList.filter((k) => k.jenis_kelamin === "P");
  const dayOneStr = "2026-08-01";

  const newBookings: BookingWithDetails[] = [];
  const newProgress: ProgressRecord[] = [];

  // Create 15 simulation bookings for Day 1
  for (let i = 0; i < Math.min(15, mockKelompokList.length); i++) {
    const k = mockKelompokList[i];
    const slotObj = mockSlotList[i % mockSlotList.length];
    const akangObj = akangs[i % akangs.length];
    const tetehObj = tetehs[i % tetehs.length];

    let status: BookingStatus = "Selesai";
    if (i === 1) status = "Menunggu Konfirmasi";
    else if (i === 2) status = "Disetujui";
    else if (i === 3) status = "Ditolak";
    else if (i === 4) status = "Dibatalkan";

    const bId = `book-sim-${i + 1}`;
    const bItem: BookingWithDetails = {
      id: bId,
      kelompok_id: k.id,
      tanggal: dayOneStr,
      slot_id: slotObj.id,
      status,
      catatan: `Simulasi Sesi Taaruf Hari Ke-1 (Kelompok ${k.nomor_kelompok})`,
      created_at: new Date().toISOString(),
      kelompok_nama: `Kelompok ${k.nomor_kelompok} (${k.kelas})`,
      slot_nama: slotObj.nama_slot,
      jam_mulai: slotObj.jam_mulai,
      jam_selesai: slotObj.jam_selesai,
      kating_list: [
        { id: akangObj.id, nama: akangObj.nama, jenis_kelamin: "L", nomor_whatsapp: akangObj.nomor_whatsapp, contacted: false, contacted_at: null },
        { id: tetehObj.id, nama: tetehObj.nama, jenis_kelamin: "P", nomor_whatsapp: tetehObj.nomor_whatsapp, contacted: false, contacted_at: null },
      ],
    };

    newBookings.push(bItem);

    // If status is Selesai, record progress for members of that group
    if (status === "Selesai") {
      const kAnggota = mockAnggotaList.filter((a) => a.kelompok_id === k.id);
      kAnggota.forEach((ang) => {
        newProgress.push({
          id: `prog-sim-${ang.id}-${akangObj.id}`,
          anggota_id: ang.id,
          booking_id: bId,
          kating_id: akangObj.id,
          created_at: new Date().toISOString(),
        });
        newProgress.push({
          id: `prog-sim-${ang.id}-${tetehObj.id}`,
          anggota_id: ang.id,
          booking_id: bId,
          kating_id: tetehObj.id,
          created_at: new Date().toISOString(),
        });
      });
    }
  }

  mockBookingList = newBookings;
  mockProgressList = newProgress;

  return {
    success: true,
    message: "Simulasi Hari Pertama Berhasil! 15 sesi booking, presensi, & progress acak telah dibuat.",
    bookingCount: mockBookingList.length,
    progressCount: mockProgressList.length,
  };
}

export function saveMockManualProgress(
  anggotaId: string,
  katingId: string,
  tanggal: string,
  slotId: string
) {
  const existing = mockProgressList.find(
    (p) => p.anggota_id === anggotaId && p.kating_id === katingId
  );
  if (existing) {
    return { success: false, message: "Anggota sudah pernah ditaarufi oleh kating ini." };
  }

  const anggota = mockAnggotaList.find((a) => a.id === anggotaId);
  const kelompokId = anggota?.kelompok_id;

  let booking = mockBookingList.find(
    (b) => b.kelompok_id === kelompokId && b.tanggal === tanggal && b.slot_id === slotId
  );

  if (!booking) {
    const newBkId = `booking-mock-manual-${Date.now()}`;
    booking = {
      id: newBkId,
      kelompok_id: kelompokId ?? "kel-1",
      tanggal,
      slot_id: slotId,
      status: "Selesai",
      catatan: "Manual entry",
      created_at: new Date().toISOString(),
    } as unknown as BookingWithDetails;
    mockBookingList.push(booking!);
  }

  mockProgressList.push({
    id: `prog-mock-${Date.now()}`,
    anggota_id: anggotaId,
    kating_id: katingId,
    booking_id: booking!.id,
    created_at: new Date().toISOString(),
  });

  return { success: true, message: "Riwayat progress berhasil ditambahkan." };
}

export function updateMockManualProgress(
  anggotaId: string,
  oldKatingId: string,
  oldBookingId: string,
  newKatingId: string,
  newTanggal: string,
  newSlotId: string
) {
  if (oldKatingId !== newKatingId) {
    const dup = mockProgressList.find(
      (p) => p.anggota_id === anggotaId && p.kating_id === newKatingId
    );
    if (dup) {
      return { success: false, message: "Anggota sudah memiliki riwayat progress dengan kating pilihan baru." };
    }
  }

  const anggota = mockAnggotaList.find((a) => a.id === anggotaId);
  const kelompokId = anggota?.kelompok_id;

  let newBooking = mockBookingList.find(
    (b) => b.kelompok_id === kelompokId && b.tanggal === newTanggal && b.slot_id === newSlotId
  );

  if (!newBooking) {
    const newBkId = `booking-mock-manual-${Date.now()}`;
    newBooking = {
      id: newBkId,
      kelompok_id: kelompokId ?? "kel-1",
      tanggal: newTanggal,
      slot_id: newSlotId,
      status: "Selesai",
      catatan: "Manual edit",
      created_at: new Date().toISOString(),
    } as unknown as BookingWithDetails;
    mockBookingList.push(newBooking!);
  }

  const idx = mockProgressList.findIndex(
    (p) => p.anggota_id === anggotaId && p.kating_id === oldKatingId && p.booking_id === oldBookingId
  );

  if (idx !== -1) {
    mockProgressList[idx] = {
      ...mockProgressList[idx],
      kating_id: newKatingId,
      booking_id: newBooking.id,
    };
  }

  return { success: true, message: "Riwayat progress berhasil diperbarui." };
}

