"use client";
import { useEffect, useState } from "react";
import { formatTanggal, rupiah } from "@/lib/format";

interface Manifes {
  keberangkatan: { id: number; tanggal: string; jam: string; driver: string };
  rute: { asal: string; tujuan: string; harga: number };
  armada: { nama: string; plat: string };
  penumpang: { kursi: string; nama: string; telp: string; kode_booking: string }[];
  total_penumpang: number;
}

export default function ManifesPage({ params }: { params: { id: string } }) {
  const [m, setM] = useState<Manifes | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/keberangkatan/${params.id}/manifes`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject((await r.json()).error)))
      .then(setM)
      .catch((e) => setErr(String(e)));
  }, [params.id]);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!m) return <p>Memuat…</p>;

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manifes Penumpang</h1>
        <button onClick={() => window.print()} className="rounded bg-sky-700 px-4 py-2 text-white hover:bg-sky-600">
          🖨️ Cetak
        </button>
      </div>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">MANIFES KEBERANGKATAN</h2>
        <div className="mt-4 grid gap-1 text-sm md:grid-cols-2">
          <p><b>Rute:</b> {m.rute.asal} → {m.rute.tujuan}</p>
          <p><b>Tanggal / Jam:</b> {formatTanggal(m.keberangkatan.tanggal)} / {m.keberangkatan.jam}</p>
          <p><b>Armada:</b> {m.armada.nama} ({m.armada.plat})</p>
          <p><b>Driver:</b> {m.keberangkatan.driver}</p>
          <p><b>Harga tiket:</b> {rupiah(m.rute.harga)}</p>
          <p><b>Total penumpang:</b> {m.total_penumpang} orang</p>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-800 text-left">
              <th className="py-2">No</th>
              <th className="py-2">Kursi</th>
              <th className="py-2">Nama Penumpang</th>
              <th className="py-2">Telepon</th>
              <th className="py-2">Kode Booking</th>
            </tr>
          </thead>
          <tbody>
            {m.penumpang.map((p, i) => (
              <tr key={p.kode_booking} className="border-b">
                <td className="py-2">{i + 1}</td>
                <td className="py-2 font-semibold">{p.kursi}</td>
                <td className="py-2">{p.nama}</td>
                <td className="py-2">{p.telp}</td>
                <td className="py-2">{p.kode_booking}</td>
              </tr>
            ))}
            {m.penumpang.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-slate-500">Belum ada penumpang.</td></tr>
            )}
          </tbody>
        </table>
        <div className="mt-8 flex justify-between text-sm">
          <div className="text-center">
            <p>Driver,</p>
            <p className="mt-12">({m.keberangkatan.driver})</p>
          </div>
          <div className="text-center">
            <p>Petugas,</p>
            <p className="mt-12">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
