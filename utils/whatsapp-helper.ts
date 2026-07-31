import type { Anggota, BookingWithDetails } from "@/types/database";

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

export function generateApprovedBookingWAMessage(params: {
  booking: BookingWithDetails;
  targetGender: "L" | "P";
  anggotaList?: Anggota[];
  ketuaNama?: string;
  kelasNama?: string;
  tempatTaaruf?: string;
}): { message: string; targetPhone: string; targetName: string } {
  const { booking, targetGender, anggotaList = [], ketuaNama, kelasNama, tempatTaaruf } = params;

  const waktu = getWaktuGreeting();
  const { hari, tanggalIndo } = formatTanggalIndo(booking.tanggal);

  const isAkang = targetGender === "L";
  const sapaan = isAkang
    ? booking.kating_laki_nama || "Akang"
    : booking.kating_perempuan_nama || "Teteh";

  const pasanganKating = isAkang
    ? booking.kating_perempuan_nama || "Teteh"
    : booking.kating_laki_nama || "Akang";

  const targetPhoneRaw = isAkang
    ? booking.kating_laki_wa || ""
    : booking.kating_perempuan_wa || "";

  const ketua = ketuaNama || (anggotaList[0]?.nama) || "Ketua Kelompok";
  const kelas = kelasNama || (booking.kelompok_nama?.match(/\((.*?)\)/)?.[1]) || "X SIJA 1";

  const slotStr = booking.slot_nama && booking.jam_mulai
    ? `${booking.slot_nama} (${booking.jam_mulai} - ${booking.jam_selesai} WIB)`
    : "Jam Istirahat";

  const memberLines = anggotaList.length > 0
    ? anggotaList.map((a, idx) => `${idx + 1}. ${a.nama}`).join("\n")
    : "1. Corel Ahmad Gustafyan\n2. Bagas Fadhlan Rinawan\n3. Sarah Rantelayuk Parura";

  const tempatStr = tempatTaaruf && tempatTaaruf.trim() !== ""
    ? `di ${tempatTaaruf.trim()}.`
    : "di (tempat taaruf).";

  const message = `Assalamu'alaikum warahmatullahi wabarakatuh.

Selamat ${waktu}.
Mohon maaf mengganggu waktunya ${sapaan}.

Izin memperkenalkan diri,
saya ${ketua}
dari kelas ${kelas}
dari RPL Angkatan @52.

Saya hendak mengajak ${sapaan} untuk ta'aruf bersama dalam rangka menjalin silaturahmi dan saling mengenal,

di hari ${hari},
tanggal ${tanggalIndo},
pada jam ${slotStr}
${tempatStr}

Bersama dengan ${pasanganKating}.

Dan beberapa rekan saya lainnya,

${memberLines}

Apakah ${sapaan} berkenan meluangkan waktu untuk ta'aruf bersama kami?

Terima kasih atas waktunya.

Wassalamu'alaikum warahmatullahi wabarakatuh.`;

  // Clean phone for WhatsApp URL
  let cleanPhone = targetPhoneRaw.replace(/\D/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.slice(1);
  }

  return {
    message,
    targetPhone: cleanPhone,
    targetName: sapaan,
  };
}

export function openWhatsAppLink(phone: string, text: string) {
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${phone}?text=${encodedText}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
