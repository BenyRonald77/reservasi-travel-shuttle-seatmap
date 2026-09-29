import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.rute.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const asal = String(body?.asal ?? "").trim();
  const tujuan = String(body?.tujuan ?? "").trim();
  const harga = Number(body?.harga);
  if (!asal || !tujuan || !Number.isFinite(harga) || harga < 0)
    return NextResponse.json(
      { error: "asal, tujuan wajib diisi dan harga harus angka >= 0" },
      { status: 400 }
    );
  const created = await prisma.rute.create({ data: { asal, tujuan, harga: Math.round(harga) } });
  return NextResponse.json(created, { status: 201 });
}
