import { PrismaClient } from "@prisma/client";
import { addDays, nowIso } from "../lib/format";

const prisma = new PrismaClient();

function layout12(): string {
  const seats: string[] = [];
  for (let row = 1; row <= 6; row++) {
    seats.push(`${row}A`, `${row}B`);
  }
  return JSON.stringify(seats);
}

async function main() {
  const n = await prisma.rute.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }

  const rute1 = await prisma.rute.create({
    data: { asal: "Jakarta", tujuan: "Bandung", harga: 120000 },
  });
  const rute2 = await prisma.rute.create({
    data: { asal: "Bandung", tujuan: "Yogyakarta", harga: 220000 },
  });

  const armada1 = await prisma.armada.create({
    data: { nama: "Shuttle Merpati 01", plat: "B 1234 ABC", jumlah_kursi: 12, layout_kursi: layout12() },
  });
  const armada2 = await prisma.armada.create({
    data: { nama: "Shuttle Garuda 02", plat: "D 5678 XYZ", jumlah_kursi: 12, layout_kursi: layout12() },
  });

  await prisma.keberangkatan.create({
    data: { rute_id: rute1.id, armada_id: armada1.id, tanggal: addDays(3), jam: "07:00", driver: "Pak Dedi" },
  });
  await prisma.keberangkatan.create({
    data: { rute_id: rute1.id, armada_id: armada2.id, tanggal: addDays(1), jam: "14:00", driver: "Pak Eko" },
  });
  await prisma.keberangkatan.create({
    data: { rute_id: rute2.id, armada_id: armada1.id, tanggal: addDays(2), jam: "20:00", driver: "Pak Fajar" },
  });

  await prisma.refundRule.createMany({
    data: [
      { nama: "> 48 jam sebelum berangkat", min_jam: 48, max_jam: null, persen: 90 },
      { nama: "24–48 jam sebelum berangkat", min_jam: 24, max_jam: 48, persen: 50 },
      { nama: "< 24 jam sebelum berangkat", min_jam: null, max_jam: 24, persen: 0 },
    ],
  });

  console.log("seed selesai:", nowIso());
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
