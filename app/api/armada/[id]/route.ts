import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = await prisma.armada.findUnique({ where: { id: Number(params.id) } });
  if (!row) return NextResponse.json({ error: "Armada tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const exists = await prisma.armada.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Armada tidak ditemukan" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const nama = String(body?.nama ?? "").trim();
  const plat = String(body?.plat ?? "").trim();
  if (!nama || !plat)
    return NextResponse.json({ error: "nama dan plat wajib diisi" }, { status: 400 });
  const updated = await prisma.armada.update({ where: { id }, data: { nama, plat } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const exists = await prisma.armada.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Armada tidak ditemukan" }, { status: 404 });
  const used = await prisma.keberangkatan.count({ where: { armada_id: id } });
  if (used > 0)
    return NextResponse.json(
      { error: "Armada masih dipakai keberangkatan, tidak bisa dihapus" },
      { status: 409 }
    );
  await prisma.armada.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
