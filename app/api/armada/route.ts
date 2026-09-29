import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLayout } from "@/lib/seats";

export async function GET() {
  const rows = await prisma.armada.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const nama = String(body?.nama ?? "").trim();
  const plat = String(body?.plat ?? "").trim();
  const layout = Array.isArray(body?.layout_kursi) ? body.layout_kursi : null;
  if (!nama || !plat || !layout || layout.length === 0)
    return NextResponse.json(
      { error: "nama, plat, dan layout_kursi (array kursi) wajib diisi" },
      { status: 400 }
    );
  const seats = layout.map((s: unknown) => String(s).trim()).filter(Boolean);
  if (new Set(seats).size !== seats.length)
    return NextResponse.json({ error: "layout_kursi tidak boleh ada duplikat" }, { status: 400 });
  const created = await prisma.armada.create({
    data: { nama, plat, jumlah_kursi: seats.length, layout_kursi: JSON.stringify(seats) },
  });
  return NextResponse.json(created, { status: 201 });
}
