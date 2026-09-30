import { NextResponse } from "next/server";
import { cleanupAllExpiredHolds } from "@/lib/seats";

export async function POST() {
  const count = await cleanupAllExpiredHolds();
  return NextResponse.json({ ok: true, dibersihkan: count });
}
