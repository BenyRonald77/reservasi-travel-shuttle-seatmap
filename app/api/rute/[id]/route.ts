import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = await prisma.rute.findUnique({ where: { id: Number(params.id) } });
  if (!row) return NextResponse.json({ error: "Rute tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const exists = await prisma.rute.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Rute tidak ditemukan" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const asal = String(body?.asal ?? "").trim();
  const tujuan = String(body?.tujuan ?? "").trim();
  const harga = Number(body?.harga);
  if (!asal || !tujuan || !Number.isFinite(harga) || harga < 0)
    return NextResponse.json(
      { error: "asal, tujuan wajib diisi dan harga harus angka >= 0" },
      { status: 400 }
    );
  const updated = await prisma.rute.update({
    where: { id },
    data: { asal, tujuan, harga: Math.round(harga) },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const exists = await prisma.rute.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Rute tidak ditemukan" }, { status: 404 });
  const used = await prisma.keberangkatan.count({ where: { rute_id: id } });
  if (used > 0)
    return NextResponse.json(
      { error: "Rute masih dipakai keberangkatan, tidak bisa dihapus" },
      { status: 409 }
    );
  await prisma.rute.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
