import type {
  Anggota,
  AnggotaProgressSummary,
  Announcement,
  BookingParticipant,
  BookingStatus,
  BookingWithDetails,
  EventSettings,
  Gender,
  Kating,
  Kelompok,
  MetKatingDetail,
  ProgressRecord,
  SlotWaktu,
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

let mockKelompokList: Kelompok[] = [
  { id: "kel-1", nomor_kelompok: 1, kelas: "X SIJA 1", username: "kelompok1", created_at: "2026-07-30T10:00:00Z" },
  { id: "kel-2", nomor_kelompok: 2, kelas: "X SIJA 2", username: "kelompok2", created_at: "2026-07-30T10:05:00Z" },
  { id: "kel-3", nomor_kelompok: 3, kelas: "X RPL 1", username: "kelompok3", created_at: "2026-07-30T10:10:00Z" },
];

let mockAnggotaList: Anggota[] = [
  { id: "ang-1", kelompok_id: "kel-1", nama: "Ahmad Fauzi", jenis_kelamin: "L", aktif: true, created_at: "2026-07-30T10:00:00Z" },
  { id: "ang-2", kelompok_id: "kel-1", nama: "Siti Rahmawati", jenis_kelamin: "P", aktif: true, created_at: "2026-07-30T10:01:00Z" },
  { id: "ang-3", kelompok_id: "kel-2", nama: "Budi Santoso", jenis_kelamin: "L", aktif: true, created_at: "2026-07-30T10:05:00Z" },
  { id: "ang-4", kelompok_id: "kel-2", nama: "Dewi Lestari", jenis_kelamin: "P", aktif: true, created_at: "2026-07-30T10:06:00Z" },
  { id: "ang-5", kelompok_id: "kel-3", nama: "Rizky Pratama", jenis_kelamin: "L", aktif: true, created_at: "2026-07-30T10:10:00Z" },
];

let mockKatingList: Kating[] = [
  { id: "kat-1", nama: "Akang Fikri Haikal", kelas: "XII SIJA 1", jenis_kelamin: "L", nomor_whatsapp: "081234567890", aktif: true, created_at: "2026-07-30T09:00:00Z" },
  { id: "kat-2", nama: "Teteh Anisa Fitri", kelas: "XII RPL 2", jenis_kelamin: "P", nomor_whatsapp: "081987654321", aktif: true, created_at: "2026-07-30T09:05:00Z" },
  { id: "kat-3", nama: "Akang Dimas Setiawan", kelas: "XI SIJA 2", jenis_kelamin: "L", nomor_whatsapp: "085712345678", aktif: true, created_at: "2026-07-30T09:10:00Z" },
  { id: "kat-4", nama: "Teteh Nurul Aini", kelas: "XI TKJ 1", jenis_kelamin: "P", nomor_whatsapp: "082134567890", aktif: true, created_at: "2026-07-30T09:15:00Z" },
];

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

let mockBookingList: BookingWithDetails[] = [
  {
    id: "book-1",
    kelompok_id: "kel-1",
    tanggal: "2026-08-03",
    slot_id: "slot-2",
    kating_laki_id: "kat-1",
    kating_perempuan_id: "kat-2",
    status: "Menunggu Konfirmasi",
    catatan: "Pengajuan awal",
    created_at: "2026-07-30T11:00:00Z",
    kelompok_nama: "Kelompok 1 (X SIJA 1)",
    slot_nama: "Istirahat 2",
    jam_mulai: "12:00",
    jam_selesai: "12:45",
    kating_laki_nama: "Akang Fikri Haikal",
    kating_perempuan_nama: "Teteh Anisa Fitri",
    kating_laki_wa: "081234567890",
    kating_perempuan_wa: "081987654321",
  },
];

let mockBookingParticipantsList: BookingParticipant[] = [];

let mockProgressList: ProgressRecord[] = [
  { id: "prog-1", anggota_id: "ang-1", booking_id: "book-0", kating_id: "kat-1", created_at: "2026-08-01T10:00:00Z" },
  { id: "prog-2", anggota_id: "ang-1", booking_id: "book-0", kating_id: "kat-2", created_at: "2026-08-01T10:00:00Z" },
  { id: "prog-3", anggota_id: "ang-2", booking_id: "book-0", kating_id: "kat-1", created_at: "2026-08-01T10:00:00Z" },
];

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

export function getAvailableKatingList(tanggal: string, slot_id: string, gender: Gender): Kating[] {
  const activeKating = mockKatingList.filter((k) => k.aktif && k.jenis_kelamin === gender);
  const busyBooking = mockBookingList.filter(
    (b) => b.tanggal === tanggal && b.slot_id === slot_id && b.status !== "Ditolak" && b.status !== "Dibatalkan"
  );
  const busyKatingIds = new Set<string>();
  busyBooking.forEach((b) => {
    if (b.kating_laki_id) busyKatingIds.add(b.kating_laki_id);
    if (b.kating_perempuan_id) busyKatingIds.add(b.kating_perempuan_id);
  });
  return activeKating.filter((k) => !busyKatingIds.has(k.id));
}

/**
 * STRICT BACKEND VALIDATED BOOKING CREATION
 */
export function createMockBooking(data: {
  kelompok_id: string;
  tanggal: string;
  slot_id: string;
  kating_laki_id: string;
  kating_perempuan_id: string;
  catatan?: string;
}) {
  // 1. Check Event Lock
  if (isEventLocked()) {
    throw new Error("Acara sedang dikunci oleh Admin. Booking baru tidak dapat dibuat.");
  }

  // 2. Check Pair Completeness
  if (!data.kating_laki_id || !data.kating_perempuan_id) {
    throw new Error("Booking wajib memilih pasangan kating lengkap (Akang & Teteh).");
  }

  // 3. Gender Pair Validation
  const kl = mockKatingList.find((kat) => kat.id === data.kating_laki_id);
  const kp = mockKatingList.find((kat) => kat.id === data.kating_perempuan_id);

  if (!kl || kl.jenis_kelamin !== "L") {
    throw new Error("Akang pendamping harus berjenis kelamin Laki-laki.");
  }

  if (!kp || kp.jenis_kelamin !== "P") {
    throw new Error("Teteh pendamping harus berjenis kelamin Perempuan.");
  }

  // 4. Slot & Date Conflict Validation
  const existingConflict = mockBookingList.find(
    (b) =>
      b.tanggal === data.tanggal &&
      b.slot_id === data.slot_id &&
      b.status !== "Ditolak" &&
      b.status !== "Dibatalkan" &&
      (b.kating_laki_id === data.kating_laki_id ||
        b.kating_perempuan_id === data.kating_perempuan_id ||
        b.kating_laki_id === data.kating_perempuan_id ||
        b.kating_perempuan_id === data.kating_laki_id)
  );

  if (existingConflict) {
    throw new Error(`Slot ${data.tanggal} sudah terpakai oleh kating yang dipilih pada kelompok lain.`);
  }

  const k = mockKelompokList.find((kel) => kel.id === data.kelompok_id || kel.username === data.kelompok_id);
  const s = mockSlotList.find((slot) => slot.id === data.slot_id);

  const newBooking: BookingWithDetails = {
    id: `book-${Date.now()}`,
    kelompok_id: k?.id || data.kelompok_id,
    tanggal: data.tanggal,
    slot_id: data.slot_id,
    kating_laki_id: data.kating_laki_id,
    kating_perempuan_id: data.kating_perempuan_id,
    status: "Menunggu Konfirmasi",
    catatan: data.catatan || null,
    created_at: new Date().toISOString(),
    kelompok_nama: k ? `Kelompok ${k.nomor_kelompok} (${k.kelas})` : "Kelompok",
    slot_nama: s ? s.nama_slot : "Slot",
    jam_mulai: s ? s.jam_mulai : "00:00",
    jam_selesai: s ? s.jam_selesai : "00:00",
    kating_laki_nama: kl ? kl.nama : "Akang",
    kating_perempuan_nama: kp ? kp.nama : "Teteh",
    kating_laki_wa: kl ? kl.nomor_whatsapp : "",
    kating_perempuan_wa: kp ? kp.nomor_whatsapp : "",
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

export function updateMockBookingContactedStatus(id: string, gender: "L" | "P") {
  const idx = mockBookingList.findIndex((b) => b.id === id);
  if (idx !== -1) {
    const timeStr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB";

    if (gender === "L") {
      mockBookingList[idx].akang_contacted = true;
      mockBookingList[idx].akang_contacted_at = timeStr;
    } else {
      mockBookingList[idx].teteh_contacted = true;
      mockBookingList[idx].teteh_contacted_at = timeStr;
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
  const katingIds = [booking.kating_laki_id, booking.kating_perempuan_id].filter(Boolean);
  let newProgressCount = 0;

  presentAnggotaIds.forEach((anggotaId) => {
    mockBookingParticipantsList.push({
      id: `part-${Date.now()}-${Math.random()}`,
      booking_id: bookingId,
      anggota_id: anggotaId,
      hadir: true,
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
      kating_laki_id: akangObj.id,
      kating_perempuan_id: tetehObj.id,
      status,
      catatan: `Simulasi Sesi Taaruf Hari Ke-1 (Kelompok ${k.nomor_kelompok})`,
      created_at: new Date().toISOString(),
      kelompok_nama: `Kelompok ${k.nomor_kelompok} (${k.kelas})`,
      slot_nama: slotObj.nama_slot,
      jam_mulai: slotObj.jam_mulai,
      jam_selesai: slotObj.jam_selesai,
      kating_laki_nama: akangObj.nama,
      kating_perempuan_nama: tetehObj.nama,
      kating_laki_wa: akangObj.nomor_whatsapp,
      kating_perempuan_wa: tetehObj.nomor_whatsapp,
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
