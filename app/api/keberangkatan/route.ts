import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { departureDate } from "@/lib/seats";

const TANGGAL_RE = /^\d{4}-\d{2}-\d{2}$/;
const JAM_RE = /^\d{2}:\d{2}$/;

function validate(body: Record<string, unknown> | null) {
  if (!body) return "Body JSON tidak valid";
  const tanggal = String(body.tanggal ?? "");
  const jam = String(body.jam ?? "");
  const driver = String(body.driver ?? "").trim();
  const rute_id = Number(body.rute_id);
  const armada_id = Number(body.armada_id);
  if (!Number.isInteger(rute_id) || !Number.isInteger(armada_id))
    return "rute_id dan armada_id wajib angka";
  if (!TANGGAL_RE.test(tanggal)) return "tanggal harus format YYYY-MM-DD";
  if (!JAM_RE.test(jam)) return "jam harus format HH:MM";
  if (!driver) return "driver wajib diisi";
  if (!departureDate(tanggal, jam)) return "tanggal/jam tidak valid";
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming");
  const where = upcoming === "1" ? { tanggal: { gte: new Date().toISOString().slice(0, 10) } } : {};
  const rows = await prisma.keberangkatan.findMany({
    where,
    include: { rute: true, armada: true },
    orderBy: [{ tanggal: "asc" }, { jam: "asc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const data = {
    rute_id: Number(body!.rute_id),
    armada_id: Number(body!.armada_id),
    tanggal: String(body!.tanggal),
    jam: String(body!.jam),
    driver: String(body!.driver).trim(),
  };
  const [rute, armada] = await Promise.all([
    prisma.rute.findUnique({ where: { id: data.rute_id } }),
    prisma.armada.findUnique({ where: { id: data.armada_id } }),
  ]);
  if (!rute) return NextResponse.json({ error: "rute_id tidak ditemukan" }, { status: 400 });
  if (!armada) return NextResponse.json({ error: "armada_id tidak ditemukan" }, { status: 400 });
  const created = await prisma.keberangkatan.create({ data });
  return NextResponse.json(created, { status: 201 });
}
