import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = await prisma.keberangkatan.findUnique({
    where: { id: Number(params.id) },
    include: {
      rute: true,
      armada: true,
      bookings: { where: { status: "booked" }, orderBy: { kursi: "asc" } },
    },
  });
  if (!row) return NextResponse.json({ error: "Keberangkatan tidak ditemukan" }, { status: 404 });
  return NextResponse.json({
    keberangkatan: {
      id: row.id,
      tanggal: row.tanggal,
      jam: row.jam,
      driver: row.driver,
    },
    rute: { asal: row.rute.asal, tujuan: row.rute.tujuan, harga: row.rute.harga },
    armada: { nama: row.armada.nama, plat: row.armada.plat },
    penumpang: row.bookings.map((b) => ({
      kursi: b.kursi,
      nama: b.nama_penumpang,
      telp: b.telp,
      kode_booking: b.kode_booking,
    })),
    total_penumpang: row.bookings.length,
  });
}
