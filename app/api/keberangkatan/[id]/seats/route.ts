import { NextRequest, NextResponse } from "next/server";
import { getSeatMap } from "@/lib/seats";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const layout = await getSeatMap(Number(params.id));
    return NextResponse.json({ kursi: layout });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND")
      return NextResponse.json({ error: "Keberangkatan tidak ditemukan" }, { status: 404 });
    throw e;
  }
}
