import { prisma } from "./prisma";
import { nowIso } from "./format";

export const HOLD_TTL_MS = 10 * 60 * 1000; // 10 menit

export type SeatStatus = "tersedia" | "dihold" | "dipesan";

export interface SeatInfo {
  kursi: string;
  status: SeatStatus;
  holder_id?: string;
  expires_at?: string;
}

export function parseLayout(layoutJson: string): string[] {
  try {
    const arr = JSON.parse(layoutJson);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Hapus hold yang sudah kedaluwarsa untuk satu keberangkatan. */
export async function cleanupExpiredHolds(keberangkatanId: number): Promise<number> {
  const r = await prisma.seatHold.deleteMany({
    where: { keberangkatan_id: keberangkatanId, expires_at: { lt: nowIso() } },
  });
  return r.count;
}

/** Hapus SEMUA hold kedaluwarsa (cleanup manual). */
export async function cleanupAllExpiredHolds(): Promise<number> {
  const r = await prisma.seatHold.deleteMany({ where: { expires_at: { lt: nowIso() } } });
  return r.count;
}

export async function getSeatMap(keberangkatanId: number): Promise<SeatInfo[]> {
  const keberangkatan = await prisma.keberangkatan.findUnique({
    where: { id: keberangkatanId },
    include: { armada: true },
  });
  if (!keberangkatan) throw new Error("NOT_FOUND");
  await cleanupExpiredHolds(keberangkatanId);
  const layout = parseLayout(keberangkatan.armada.layout_kursi);
  const bookings = await prisma.booking.findMany({
    where: { keberangkatan_id: keberangkatanId, status: "booked" },
    select: { kursi: true },
  });
  const holds = await prisma.seatHold.findMany({
    where: { keberangkatan_id: keberangkatanId },
  });
  const bookedSet = new Set(bookings.map((b) => b.kursi));
  const holdMap = new Map(holds.map((h) => [h.kursi, h]));
  return layout.map((kursi) => {
    if (bookedSet.has(kursi)) return { kursi, status: "dipesan" as SeatStatus };
    const hold = holdMap.get(kursi);
    if (hold)
      return {
        kursi,
        status: "dihold" as SeatStatus,
        holder_id: hold.holder_id,
        expires_at: hold.expires_at,
      };
    return { kursi, status: "tersedia" as SeatStatus };
  });
}

/** Parse tanggal+jam keberangkatan menjadi Date lokal. */
export function departureDate(tanggal: string, jam: string): Date | null {
  const d = new Date(`${tanggal}T${jam}:00`);
  return isNaN(d.getTime()) ? null : d;
}

export interface RefundEstimate {
  jam_sebelum: number;
  persen: number;
  refund_rp: number;
  rule_nama: string;
}

export async function estimateRefund(
  harga: number,
  tanggal: string,
  jam: string
): Promise<RefundEstimate> {
  const dep = departureDate(tanggal, jam);
  if (!dep) throw new Error("INVALID_DATE");
  const jamSebelum = (dep.getTime() - Date.now()) / 3600000;
  if (jamSebelum <= 0) throw new Error("DEPARTED");
  const rules = await prisma.refundRule.findMany({ orderBy: { min_jam: "desc" } });
  const match = rules.find(
    (r) =>
      (r.min_jam === null || jamSebelum >= r.min_jam) &&
      (r.max_jam === null || jamSebelum < r.max_jam)
  );
  const persen = match ? match.persen : 0;
  return {
    jam_sebelum: Math.round(jamSebelum * 100) / 100,
    persen,
    refund_rp: Math.round((harga * persen) / 100),
    rule_nama: match ? match.nama : "Tidak ada aturan cocok (0%)",
  };
}

const KODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function generateKodeBooking(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    let s = "";
    for (let j = 0; j < 6; j++)
      s += KODE_ALPHABET[Math.floor(Math.random() * KODE_ALPHABET.length)];
    const kode = `TRV-${s}`;
    const exists = await prisma.booking.findUnique({ where: { kode_booking: kode } });
    if (!exists) return kode;
  }
  throw new Error("KODE_FAIL");
}
