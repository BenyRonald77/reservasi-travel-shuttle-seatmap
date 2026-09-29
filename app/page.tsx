"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { rupiah, formatTanggal } from "@/lib/format";

interface Stats {
  rute: number;
  armada: number;
  upcoming: number;
  bookingAktif: number;
}

interface Keberangkatan {
  id: number;
  tanggal: string;
  jam: string;
  rute: { asal: string; tujuan: string; harga: number };
  armada: { nama: string };
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcoming, setUpcoming] = useState<Keberangkatan[]>([]);

  useEffect(() => {
    (async () => {
      const [r, a, k, b] = await Promise.all([
        fetch("/api/rute").then((x) => x.json()),
        fetch("/api/armada").then((x) => x.json()),
        fetch("/api/keberangkatan?upcoming=1").then((x) => x.json()),
        fetch("/api/bookings").then((x) => x.json()),
      ]);
      setStats({
        rute: r.length,
        armada: a.length,
        upcoming: k.length,
        bookingAktif: b.filter((x: { status: string }) => x.status === "booked").length,
      });
      setUpcoming(k.slice(0, 5));
    })();
  }, []);

  const cards = [
    { label: "Rute", value: stats?.rute ?? "…", href: "/rute", color: "bg-sky-100 text-sky-800" },
    { label: "Armada", value: stats?.armada ?? "…", href: "/armada", color: "bg-emerald-100 text-emerald-800" },
    { label: "Keberangkatan Mendatang", value: stats?.upcoming ?? "…", href: "/keberangkatan", color: "bg-amber-100 text-amber-800" },
    { label: "Booking Aktif", value: stats?.bookingAktif ?? "…", href: "/pembatalan", color: "bg-violet-100 text-violet-800" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-slate-600">Ringkasan operasional travel &amp; shuttle.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`rounded-xl p-5 ${c.color} shadow-sm hover:shadow`}>
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="mt-1 text-sm font-medium">{c.label}</div>
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Keberangkatan Terdekat</h2>
        <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Jam</th>
                <th className="px-4 py-2">Rute</th>
                <th className="px-4 py-2">Armada</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((k) => (
                <tr key={k.id} className="border-t">
                  <td className="px-4 py-2">{formatTanggal(k.tanggal)}</td>
                  <td className="px-4 py-2">{k.jam}</td>
                  <td className="px-4 py-2">{k.rute.asal} → {k.rute.tujuan} ({rupiah(k.rute.harga)})</td>
                  <td className="px-4 py-2">{k.armada.nama}</td>
                  <td className="px-4 py-2">
                    <Link href={`/booking?keberangkatan_id=${k.id}`} className="text-sky-700 hover:underline">Booking</Link>
                    {" | "}
                    <Link href={`/manifes/${k.id}`} className="text-sky-700 hover:underline">Manifes</Link>
                  </td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Belum ada keberangkatan mendatang.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/booking" className="rounded-xl bg-sky-700 p-5 text-white shadow-sm hover:bg-sky-600">
          <div className="text-lg font-bold">🎫 Booking Kursi</div>
          <div className="mt-1 text-sm text-sky-100">Pilih keberangkatan, tahan kursi dari denah, lalu booking.</div>
        </Link>
        <Link href="/pembatalan" className="rounded-xl bg-white p-5 shadow-sm hover:shadow">
          <div className="text-lg font-bold">↩️ Pembatalan &amp; Refund</div>
          <div className="mt-1 text-sm text-slate-600">Cek estimasi refund bertingkat lalu batalkan booking.</div>
        </Link>
      </div>
    </div>
  );
}
