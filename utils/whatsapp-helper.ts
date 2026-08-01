import type { Anggota, BookingWithDetails, KatingBasic } from "@/types/database";

export function getWaktuGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return "pagi";
  if (hour >= 11 && hour < 15) return "siang";
  if (hour >= 15 && hour < 18) return "sore";
  return "malam";
}

export function checkIsOperationalHours(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 20;
}

export function formatTanggalIndo(tanggalStr: string): { hari: string; tanggalIndo: string } {
  try {
    const d = new Date(tanggalStr);
    const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulanList = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const hari = hariList[d.getDay()] || "Senin";
    const tgl = d.getDate();
    const bln = bulanList[d.getMonth()] || "Agustus";
    const thn = d.getFullYear();

    return {
      hari,
      tanggalIndo: `${tgl} ${bln} ${thn}`,
    };
  } catch {
    return { hari: "Senin", tanggalIndo: tanggalStr };
  }
}

/**
 * Generate WhatsApp message strictly according to the format required:
 *
 * Assalamu'alaikum warahmatullahi wabarakatuh.
 * Selamat [pagi/siang/sore]. Mohon maaf mengganggu waktunya Akang/Teteh.
 *
 * Izin memperkenalkan diri, saya [isi] dari kelas [isi] Angkatan @52.
 *
 * Saya hendak mengajak Akang/Teteh untuk ta'aruf bersama dalam rangka menjalin silaturahmi dan saling mengenal, di hari [isi], tanggal [isi] pada jam [beritahu dengan spesifik] di [tempat taaruf].
 *
 * Bersama dengan Akang/Teteh lainnya, yaitu [akang/teteh yg diikutsertakan].
 *
 * Dan beberapa rekan saya,
 * [sebutkan nama rekan]
 *
 * Apakah Akang/Teteh berkenan meluangkan waktu untuk ta'aruf bersama kami? Terima kasih atas waktunya.
 *
 * Wassalamu'alaikum warahmatullahi wabarakatuh
 */
export function generateApprovedBookingWAMessage(params: {
  booking: BookingWithDetails;
  /** Kating target yang akan dihubungi */
  targetKating: KatingBasic;
  anggotaList?: Anggota[];
  ketuaNama?: string;
  kelasNama?: string;
  tempatTaaruf?: string;
}): { message: string; targetPhone: string; targetName: string } {
  const { booking, targetKating, anggotaList = [], ketuaNama, kelasNama, tempatTaaruf } = params;

  const waktu = getWaktuGreeting();
  const { hari, tanggalIndo } = formatTanggalIndo(booking.tanggal);

  // Target honorific & name
  const sapaanTarget = targetKating.jenis_kelamin === "L"
    ? (targetKating.nama.startsWith("Akang") ? targetKating.nama : `Akang ${targetKating.nama}`)
    : (targetKating.nama.startsWith("Teteh") ? targetKating.nama : `Teteh ${targetKating.nama}`);

  // Other kating names (excluding target)
  const otherKatingList = (booking.kating_list ?? [])
    .filter((k) => k.id !== targetKating.id)
    .map((k) => (k.jenis_kelamin === "L"
      ? (k.nama.startsWith("Akang") ? k.nama : `Akang ${k.nama}`)
      : (k.nama.startsWith("Teteh") ? k.nama : `Teteh ${k.nama}`)));

  const otherKatingStr = otherKatingList.length > 0 ? otherKatingList.join(", ") : "";

  const targetPhoneRaw = targetKating.nomor_whatsapp || "";
  const ketua = ketuaNama || (anggotaList[0]?.nama) || "Ketua Kelompok";
  const kelas = kelasNama || (booking.kelompok_nama?.match(/\((.*?)\)/)?.[1]) || "-";

  const slotStr = booking.slot_nama && booking.jam_mulai
    ? `${booking.slot_nama} (${booking.jam_mulai} - ${booking.jam_selesai} WIB)`
    : "Jam Istirahat";

  const memberLines = anggotaList.length > 0
    ? anggotaList.map((a, idx) => `${idx + 1}. ${a.nama}`).join("\n")
    : "(Daftar anggota kelompok)";

  const tempatStr = (booking.tempat_taaruf || tempatTaaruf || "Lokasi Taaruf").trim();

  const bersamaLine = otherKatingStr
    ? `Bersama dengan Akang/Teteh lainnya, yaitu ${otherKatingStr}.\n\n`
    : "";

  const message = `Assalamu'alaikum warahmatullahi wabarakatuh.
Selamat ${waktu}. Mohon maaf mengganggu waktunya ${sapaanTarget}.

Izin memperkenalkan diri, saya ${ketua} dari kelas ${kelas} Angkatan @52.

Saya hendak mengajak ${sapaanTarget} untuk ta'aruf bersama dalam rangka menjalin silaturahmi dan saling mengenal, di hari ${hari}, tanggal ${tanggalIndo} pada jam ${slotStr} di ${tempatStr}.

${bersamaLine}Dan beberapa rekan saya,
${memberLines}

Apakah ${sapaanTarget} berkenan meluangkan waktu untuk ta'aruf bersama kami? Terima kasih atas waktunya.

Wassalamu'alaikum warahmatullahi wabarakatuh`;

  // Clean phone for WhatsApp URL
  let cleanPhone = targetPhoneRaw.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  }

  return {
    message,
    targetPhone: cleanPhone,
    targetName: sapaanTarget,
  };
}

export function openWhatsAppLink(phone: string, text: string) {
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${phone}?text=${encodedText}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
