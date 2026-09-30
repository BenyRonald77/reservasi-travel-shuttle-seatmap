"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { rupiah, formatTanggal } from "@/lib/format";

interface Seat { kursi: string; status: "tersedia" | "dihold" | "dipesan"; holder_id?: string; expires_at?: string; }
interface Keberangkatan {
  id: number; tanggal: string; jam: string;
  rute: { asal: string; tujuan: string; harga: number };
  armada: { nama: string };
}

function fmtSisa(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function BookingPageInner() {
  const searchParams = useSearchParams();
  const [list, setList] = useState<Keberangkatan[]>([]);
  const [kid, setKid] = useState<string>(searchParams.get("keberangkatan_id") ?? "");
  const [detail, setDetail] = useState<Keberangkatan | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [holderId, setHolderId] = useState("");
  const [holdKursi, setHoldKursi] = useState<string | null>(null);
  const [holdExpiry, setHoldExpiry] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [nama, setNama] = useState("");
  const [telp, setTelp] = useState("");
  const [err, setErr] = useState("");
  const [sukses, setSukses] = useState<{ kode: string; kursi: string; harga: number } | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const refreshSeats = useCallback(async (id: string) => {
    if (!id) return;
    const r = await fetch(`/api/keberangkatan/${id}/seats`);
    if (r.ok) setSeats((await r.json()).kursi);
  }, []);

  useEffect(() => {
    fetch("/api/keberangkatan?upcoming=1").then((r) => r.json()).then(setList);
  }, []);

  useEffect(() => {
    if (!kid) { setDetail(null); setSeats([]); return; }
    fetch(`/api/keberangkatan/${kid}`).then((r) => (r.ok ? r.json() : null)).then(setDetail);
    refreshSeats(kid);
    setSukses(null); setHoldKursi(null); setHoldExpiry(null); setErr("");
  }, [kid, refreshSeats]);

  useEffect(() => {
    if (holdExpiry) {
      timer.current = setInterval(() => setNow(Date.now()), 1000);
    } else if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [holdExpiry]);

  useEffect(() => {
    if (holdExpiry && now > holdExpiry) {
      setHoldKursi(null); setHoldExpiry(null); setErr("Hold kedaluwarsa, silakan tahan kursi lagi.");
      if (kid) refreshSeats(kid);
    }
  }, [now, holdExpiry, kid, refreshSeats]);

  async function tahan(kursi: string) {
    setErr("");
    if (!holderId.trim()) { setErr("Isi dulu Nama/ID pemegang (holder) sebelum menahan kursi."); return; }
    const res = await fetch(`/api/keberangkatan/${kid}/hold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kursi, holder_id: holderId.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Gagal menahan kursi"); refreshSeats(kid); return; }
    setHoldKursi(kursi);
    setHoldExpiry(new Date(data.expires_at).getTime());
    refreshSeats(kid);
  }

  async function lepasHold() {
    if (!holdKursi) return;
    await fetch(`/api/keberangkatan/${kid}/hold`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kursi: holdKursi, holder_id: holderId.trim() }),
    });
    setHoldKursi(null); setHoldExpiry(null);
    refreshSeats(kid);
  }

  async function booking(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!holdKursi) { setErr("Tahan dulu kursi dari denah sebelum booking."); return; }
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keberangkatan_id: Number(kid), kursi: holdKursi,
        nama, telp, holder_id: holderId.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Gagal booking"); refreshSeats(kid); return; }
    setSukses({ kode: data.kode_booking, kursi: data.kursi, harga: data.harga });
    setHoldKursi(null); setHoldExpiry(null); setNama(""); setTelp("");
    refreshSeats(kid);
  }

  const cols = 2;

  return (
    <div>
      <h1 className="text-2xl font-bold">Booking Kursi</h1>
      <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
        <label className="text-sm font-medium">Pilih keberangkatan</label>
        <select className="mt-1 w-full rounded border px-3 py-2" value={kid} onChange={(e) => setKid(e.target.value)}>
          <option value="">— Pilih —</option>
          {list.map((k) => (
            <option key={k.id} value={k.id}>
              {formatTanggal(k.tanggal)} {k.jam} — {k.rute.asal} → {k.rute.tujuan} ({k.armada.nama})
            </option>
          ))}
        </select>
        {detail && (
          <p className="mt-2 text-sm text-slate-600">
            {detail.rute.asal} → {detail.rute.tujuan} · {formatTanggal(detail.tanggal)} {detail.jam} ·
            {" "}{detail.armada.nama} · <b>{rupiah(detail.rute.harga)}</b>/kursi
          </p>
        )}
      </div>

      {kid && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Denah Kursi</h2>
            <div className="mt-2 flex gap-4 text-xs text-slate-600">
              <span><span className="mr-1 inline-block h-3 w-3 rounded bg-emerald-200 align-middle" /> Tersedia</span>
              <span><span className="mr-1 inline-block h-3 w-3 rounded bg-amber-300 align-middle" /> Ditahan</span>
              <span><span className="mr-1 inline-block h-3 w-3 rounded bg-slate-300 align-middle" /> Dipesan</span>
            </div>
            <div className="mx-auto mt-4 grid max-w-xs gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
              {seats.map((s) => (
                <button
                  key={s.kursi}
                  disabled={s.status !== "tersedia"}
                  onClick={() => tahan(s.kursi)}
                  title={s.status === "dihold" ? `Ditahan oleh ${s.holder_id}` : s.kursi}
                  className={`rounded-lg border px-4 py-3 text-center font-semibold ${
                    s.status === "tersedia"
                      ? "border-emerald-300 bg-emerald-100 hover:bg-emerald-200"
                      : s.status === "dihold"
                      ? "cursor-not-allowed border-amber-300 bg-amber-200 text-amber-900"
                      : "cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400"
                  } ${holdKursi === s.kursi ? "ring-2 ring-sky-600" : ""}`}
                >
                  {s.kursi}
                </button>
              ))}
            </div>
            <button onClick={() => refreshSeats(kid)} className="mt-4 text-sm text-sky-700 hover:underline">↻ Muat ulang denah</button>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Data Pemegang &amp; Penumpang</h2>
            <label className="mt-3 block text-sm font-medium">Nama/ID pemegang (untuk hold)</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={holderId} onChange={(e) => setHolderId(e.target.value)} placeholder="mis. Bpk Andi / 0812xxxx" />
            {holdKursi && holdExpiry && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">
                Kursi <b>{holdKursi}</b> ditahan untuk Anda. Sisa waktu hold:{" "}
                <b className="text-amber-700">{fmtSisa(holdExpiry - now)}</b>
                <button onClick={lepasHold} className="ml-3 text-xs text-red-600 hover:underline">Lepas</button>
              </div>
            )}
            <form onSubmit={booking} className="mt-3 grid gap-3">
              <div>
                <label className="text-sm font-medium">Nama penumpang</label>
                <input className="mt-1 w-full rounded border px-3 py-2" value={nama} onChange={(e) => setNama(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">No. telepon</label>
                <input className="mt-1 w-full rounded border px-3 py-2" value={telp} onChange={(e) => setTelp(e.target.value)} />
              </div>
              <button className="rounded bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-600" disabled={!holdKursi}>
                Booking Sekarang {holdKursi ? `(Kursi ${holdKursi})` : ""}
              </button>
            </form>
            {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
            {sukses && (
              <div className="mt-3 rounded-lg bg-emerald-50 p-4 text-sm">
                <p className="font-bold text-emerald-800">✅ Booking berhasil!</p>
                <p>Kode booking: <b className="text-lg">{sukses.kode}</b></p>
                <p>Kursi {sukses.kursi} · {rupiah(sukses.harga)}</p>
                <p className="mt-1 text-slate-600">Simpan kode ini untuk pembatalan/refund.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div>Memuat…</div>}>
      <BookingPageInner />
    </Suspense>
  );
}
