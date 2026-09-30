import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanupExpiredHolds, generateKodeBooking, parseLayout } from "@/lib/seats";
import { nowIso } from "@/lib/format";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keberangkatan_id = searchParams.get("keberangkatan_id");
  const kode = searchParams.get("kode");
  const where: Record<string, unknown> = {};
  if (keberangkatan_id) where.keberangkatan_id = Number(keberangkatan_id);
  if (kode) where.kode_booking = kode;
  const rows = await prisma.booking.findMany({
    where,
    include: { keberangkatan: { include: { rute: true, armada: true } } },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const keberangkatan_id = Number(body?.keberangkatan_id);
  const kursi = String(body?.kursi ?? "").trim();
  const nama = String(body?.nama ?? "").trim();
  const telp = String(body?.telp ?? "").trim();
  const holder_id = String(body?.holder_id ?? "").trim();

  if (!Number.isInteger(keberangkatan_id) || !kursi || !nama || !telp || !holder_id)
    return NextResponse.json(
      { error: "keberangkatan_id, kursi, nama, telp, holder_id wajib diisi" },
      { status: 400 }
    );

  const keberangkatan = await prisma.keberangkatan.findUnique({
    where: { id: keberangkatan_id },
    include: { rute: true, armada: true },
  });
  if (!keberangkatan)
    return NextResponse.json({ error: "Keberangkatan tidak ditemukan" }, { status: 404 });

  const layout = parseLayout(keberangkatan.armada.layout_kursi);
  if (!layout.includes(kursi))
    return NextResponse.json(
      { error: `Kursi ${kursi} tidak ada di layout armada` },
      { status: 400 }
    );

  await cleanupExpiredHolds(keberangkatan_id);

  // Kursi hanya bisa di-booking oleh holder yang menahan kursi tersebut
  const hold = await prisma.seatHold.findUnique({
    where: { keberangkatan_id_kursi: { keberangkatan_id, kursi } },
  });
  if (!hold || hold.holder_id !== holder_id)
    return NextResponse.json(
      { error: `Kursi ${kursi} belum ditahan oleh Anda. Tahan kursi dulu sebelum booking.` },
      { status: 409 }
    );

  const booked = await prisma.booking.findFirst({
    where: { keberangkatan_id, kursi, status: "booked" },
  });
  if (booked)
    return NextResponse.json({ error: `Kursi ${kursi} sudah dipesan` }, { status: 409 });

  const kode_booking = await generateKodeBooking();
  const booking = await prisma.booking.create({
    data: {
      keberangkatan_id,
      kode_booking,
      nama_penumpang: nama,
      telp,
      kursi,
      harga: keberangkatan.rute.harga,
      status: "booked",
      refund_rp: 0,
      created_at: nowIso(),
    },
  });
  await prisma.seatHold.delete({ where: { id: hold.id } });
  return NextResponse.json(booking, { status: 201 });
}
