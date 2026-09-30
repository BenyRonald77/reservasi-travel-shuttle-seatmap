import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { estimateRefund } from "@/lib/seats";

/** POST /api/bookings/[id]/cancel {preview?: boolean} */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { keberangkatan: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
  if (booking.status === "cancelled")
    return NextResponse.json({ error: "Booking sudah dibatalkan" }, { status: 409 });

  let estimate;
  try {
    estimate = await estimateRefund(
      booking.harga,
      booking.keberangkatan.tanggal,
      booking.keberangkatan.jam
    );
  } catch (e) {
    if (e instanceof Error && e.message === "DEPARTED")
      return NextResponse.json(
        { error: "Keberangkatan sudah lewat, tidak bisa dibatalkan" },
        { status: 400 }
      );
    throw e;
  }

  const body = await req.json().catch(() => ({}));
  if (body?.preview) {
    return NextResponse.json({
      preview: true,
      booking_id: booking.id,
      kode_booking: booking.kode_booking,
      harga: booking.harga,
      ...estimate,
    });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "cancelled", refund_rp: estimate.refund_rp },
  });
  return NextResponse.json({ ...updated, persen: estimate.persen, rule_nama: estimate.rule_nama });
}
