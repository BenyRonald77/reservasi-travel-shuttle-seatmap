import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.refundRule.findMany({ orderBy: { min_jam: "desc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const nama = String(body?.nama ?? "").trim();
  const persen = Number(body?.persen);
  const min_jam = body?.min_jam === null || body?.min_jam === undefined || body?.min_jam === "" ? null : Number(body.min_jam);
  const max_jam = body?.max_jam === null || body?.max_jam === undefined || body?.max_jam === "" ? null : Number(body.max_jam);
  if (!nama)
    return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  if (!Number.isInteger(persen) || persen < 0 || persen > 100)
    return NextResponse.json({ error: "persen harus bilangan bulat 0–100" }, { status: 400 });
  if ((min_jam !== null && !Number.isFinite(min_jam)) || (max_jam !== null && !Number.isFinite(max_jam)))
    return NextResponse.json({ error: "min_jam/max_jam harus angka atau kosong" }, { status: 400 });
  if (min_jam !== null && max_jam !== null && min_jam >= max_jam)
    return NextResponse.json({ error: "min_jam harus lebih kecil dari max_jam" }, { status: 400 });
  const created = await prisma.refundRule.create({ data: { nama, min_jam, max_jam, persen } });
  return NextResponse.json(created, { status: 201 });
}
