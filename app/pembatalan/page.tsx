"use client";
import { useEffect, useState } from "react";
import { rupiah, formatTanggal } from "@/lib/format";

interface Booking {
  id: number;
  kode_booking: string;
  nama_penumpang: string;
  telp: string;
  kursi: string;
  harga: number;
  status: string;
  refund_rp: number;
  keberangkatan: { tanggal: string; jam: string; rute: { asal: string; tujuan: string } };
}

interface Preview {
  persen: number;
  refund_rp: number;
  jam_sebelum: number;
  rule_nama: string;
}

export default function PembatalanPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<{ booking: Booking; est: Preview } | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    const p = q ? `?kode=${encodeURIComponent(q)}` : "";
    fetch(`/api/bookings${p}`).then((r) => r.json()).then(setRows);
  };
  useEffect(() => { load(); }, []);

  async function cekRefund(b: Booking) {
    setErr(""); setMsg(""); setPreview(null);
    const res = await fetch(`/api/bookings/${b.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preview: true }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Gagal menghitung refund"); return; }
    setPreview({ booking: b, est: data });
  }

  async function batalkan() {
    if (!preview) return;
    if (!confirm(`Batalkan booking ${preview.booking.kode_booking}?`)) return;
    const res = await fetch(`/api/bookings/${preview.booking.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Gagal membatalkan"); return; }
    setMsg(`Booking ${data.kode_booking} dibatalkan. Refund: ${rupiah(data.refund_rp)} (${data.persen}%).`);
    setPreview(null);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Pembatalan &amp; Refund</h1>
      <div className="mt-4 flex gap-2">
        <input className="w-full max-w-sm rounded border px-3 py-2" placeholder="Cari kode booking…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button onClick={load} className="rounded bg-sky-700 px-4 py-2 text-white hover:bg-sky-600">Cari</button>
      </div>
      {msg && <p className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</p>}
      {err && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-100 text-left"><th className="px-4 py-2">Kode</th><th className="px-4 py-2">Penumpang</th><th className="px-4 py-2">Kursi</th><th className="px-4 py-2">Keberangkatan</th><th className="px-4 py-2">Harga</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Aksi</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-4 py-2 font-mono font-semibold">{b.kode_booking}</td>
                <td className="px-4 py-2">{b.nama_penumpang}<br /><span className="text-xs text-slate-500">{b.telp}</span></td>
                <td className="px-4 py-2">{b.kursi}</td>
                <td className="px-4 py-2">{b.keberangkatan.rute.asal} → {b.keberangkatan.rute.tujuan}<br /><span className="text-xs text-slate-500">{formatTanggal(b.keberangkatan.tanggal)} {b.keberangkatan.jam}</span></td>
                <td className="px-4 py-2">{rupiah(b.harga)}</td>
                <td className="px-4 py-2">
                  {b.status === "booked"
                    ? <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Aktif</span>
                    : <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Batal (refund {rupiah(b.refund_rp)})</span>}
                </td>
                <td className="px-4 py-2">
                  {b.status === "booked" && (
                    <button onClick={() => cekRefund(b)} className="text-red-600 hover:underline">Cek refund &amp; batalkan</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
          <h2 className="font-bold">Estimasi Refund — {preview.booking.kode_booking}</h2>
          <div className="mt-2 grid gap-1 text-sm md:grid-cols-2">
            <p>Aturan yang berlaku: <b>{preview.est.rule_nama}</b></p>
            <p>Sisa waktu ke berangkat: <b>{preview.est.jam_sebelum} jam</b></p>
            <p>Harga tiket: <b>{rupiah(preview.booking.harga)}</b></p>
            <p>Estimasi refund: <b className="text-lg text-emerald-700">{rupiah(preview.est.refund_rp)}</b> ({preview.est.persen}%)</p>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={batalkan} className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500">
              Ya, Batalkan Booking
            </button>
            <button onClick={() => setPreview(null)} className="rounded bg-slate-200 px-4 py-2">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
