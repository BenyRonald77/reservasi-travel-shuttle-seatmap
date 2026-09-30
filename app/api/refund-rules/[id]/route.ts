import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = await prisma.refundRule.findUnique({ where: { id: Number(params.id) } });
  if (!row) return NextResponse.json({ error: "Aturan tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const exists = await prisma.refundRule.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Aturan tidak ditemukan" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (body?.nama !== undefined) {
    const nama = String(body.nama).trim();
    if (!nama) return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
    data.nama = nama;
  }
  if (body?.persen !== undefined) {
    const persen = Number(body.persen);
    if (!Number.isInteger(persen) || persen < 0 || persen > 100)
      return NextResponse.json({ error: "persen harus bilangan bulat 0–100" }, { status: 400 });
    data.persen = persen;
  }
  if (body?.min_jam !== undefined)
    data.min_jam = body.min_jam === null || body.min_jam === "" ? null : Number(body.min_jam);
  if (body?.max_jam !== undefined)
    data.max_jam = body.max_jam === null || body.max_jam === "" ? null : Number(body.max_jam);
  const min = data.min_jam !== undefined ? data.min_jam : exists.min_jam;
  const max = data.max_jam !== undefined ? data.max_jam : exists.max_jam;
  if (min !== null && max !== null && (min as number) >= (max as number))
    return NextResponse.json({ error: "min_jam harus lebih kecil dari max_jam" }, { status: 400 });
  const updated = await prisma.refundRule.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const exists = await prisma.refundRule.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Aturan tidak ditemukan" }, { status: 404 });
  await prisma.refundRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
