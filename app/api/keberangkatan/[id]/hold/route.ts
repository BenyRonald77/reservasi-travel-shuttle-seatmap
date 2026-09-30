import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanupExpiredHolds, HOLD_TTL_MS, parseLayout } from "@/lib/seats";
import { nowIso } from "@/lib/format";

/** POST /api/keberangkatan/[id]/hold {kursi, holder_id} */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const keberangkatanId = Number(params.id);
  const keberangkatan = await prisma.keberangkatan.findUnique({
    where: { id: keberangkatanId },
    include: { armada: true },
  });
  if (!keberangkatan)
    return NextResponse.json({ error: "Keberangkatan tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const kursi = String(body?.kursi ?? "").trim();
  const holder_id = String(body?.holder_id ?? "").trim();
  if (!kursi || !holder_id)
    return NextResponse.json({ error: "kursi dan holder_id wajib diisi" }, { status: 400 });

  const layout = parseLayout(keberangkatan.armada.layout_kursi);
  if (!layout.includes(kursi))
    return NextResponse.json({ error: `Kursi ${kursi} tidak ada di layout armada` }, { status: 400 });

  await cleanupExpiredHolds(keberangkatanId);

  const booked = await prisma.booking.findFirst({
    where: { keberangkatan_id: keberangkatanId, kursi, status: "booked" },
  });
  if (booked)
    return NextResponse.json({ error: `Kursi ${kursi} sudah dipesan` }, { status: 409 });

  const existing = await prisma.seatHold.findUnique({
    where: { keberangkatan_id_kursi: { keberangkatan_id: keberangkatanId, kursi } },
  });
  if (existing) {
    if (existing.holder_id === holder_id) {
      // Refresh hold milik sendiri
      const refreshed = await prisma.seatHold.update({
        where: { id: existing.id },
        data: { expires_at: new Date(Date.now() + HOLD_TTL_MS).toISOString() },
      });
      return NextResponse.json(refreshed, { status: 200 });
    }
    return NextResponse.json({ error: `Kursi ${kursi} sedang ditahan penumpang lain` }, { status: 409 });
  }

  const hold = await prisma.seatHold.create({
    data: {
      keberangkatan_id: keberangkatanId,
      kursi,
      holder_id,
      expires_at: new Date(Date.now() + HOLD_TTL_MS).toISOString(),
      created_at: nowIso(),
    },
  });
  return NextResponse.json(hold, { status: 201 });
}

/** DELETE /api/keberangkatan/[id]/hold {kursi, holder_id} — lepas hold sendiri */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const keberangkatanId = Number(params.id);
  const body = await req.json().catch(() => null);
  const kursi = String(body?.kursi ?? "").trim();
  const holder_id = String(body?.holder_id ?? "").trim();
  if (!kursi || !holder_id)
    return NextResponse.json({ error: "kursi dan holder_id wajib diisi" }, { status: 400 });
  const existing = await prisma.seatHold.findUnique({
    where: { keberangkatan_id_kursi: { keberangkatan_id: keberangkatanId, kursi } },
  });
  if (!existing || existing.holder_id !== holder_id)
    return NextResponse.json({ error: "Hold tidak ditemukan" }, { status: 404 });
  await prisma.seatHold.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
