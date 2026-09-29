import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = await prisma.keberangkatan.findUnique({
    where: { id: Number(params.id) },
    include: { rute: true, armada: true },
  });
  if (!row) return NextResponse.json({ error: "Keberangkatan tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const exists = await prisma.keberangkatan.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Keberangkatan tidak ditemukan" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const data: { tanggal?: string; jam?: string; driver?: string } = {};
  if (body?.tanggal !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.tanggal)))
      return NextResponse.json({ error: "tanggal harus format YYYY-MM-DD" }, { status: 400 });
    data.tanggal = String(body.tanggal);
  }
  if (body?.jam !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(String(body.jam)))
      return NextResponse.json({ error: "jam harus format HH:MM" }, { status: 400 });
    data.jam = String(body.jam);
  }
  if (body?.driver !== undefined) {
    const d = String(body.driver).trim();
    if (!d) return NextResponse.json({ error: "driver wajib diisi" }, { status: 400 });
    data.driver = d;
  }
  const updated = await prisma.keberangkatan.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const exists = await prisma.keberangkatan.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Keberangkatan tidak ditemukan" }, { status: 404 });
  const booked = await prisma.booking.count({ where: { keberangkatan_id: id, status: "booked" } });
  if (booked > 0)
    return NextResponse.json(
      { error: "Masih ada booking aktif, tidak bisa dihapus" },
      { status: 409 }
    );
  await prisma.seatHold.deleteMany({ where: { keberangkatan_id: id } });
  await prisma.booking.deleteMany({ where: { keberangkatan_id: id } });
  await prisma.keberangkatan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
