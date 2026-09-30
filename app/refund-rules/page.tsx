"use client";
import { useEffect, useState } from "react";

interface Rule { id: number; nama: string; min_jam: number | null; max_jam: number | null; persen: number; }

export default function RefundRulesPage() {
  const [rows, setRows] = useState<Rule[]>([]);
  const [nama, setNama] = useState("");
  const [minJam, setMinJam] = useState("");
  const [maxJam, setMaxJam] = useState("");
  const [persen, setPersen] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const load = () => fetch("/api/refund-rules").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  const reset = () => { setNama(""); setMinJam(""); setMaxJam(""); setPersen(""); setEditId(null); setErr(""); };
  const num = (v: string) => (v.trim() === "" ? null : Number(v.trim()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const body = { nama, min_jam: num(minJam), max_jam: num(maxJam), persen: Number(persen) };
    const res = await fetch(editId ? `/api/refund-rules/${editId}` : "/api/refund-rules", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { setErr((await res.json()).error ?? "Gagal menyimpan"); return; }
    reset(); load();
  }

  async function hapus(id: number) {
    if (!confirm("Hapus aturan ini?")) return;
    await fetch(`/api/refund-rules/${id}`, { method: "DELETE" });
    load();
  }

  function edit(r: Rule) {
    setEditId(r.id); setNama(r.nama);
    setMinJam(r.min_jam === null ? "" : String(r.min_jam));
    setMaxJam(r.max_jam === null ? "" : String(r.max_jam));
    setPersen(String(r.persen));
  }

  const label = (r: Rule) => {
    const lo = r.min_jam === null ? "" : `≥ ${r.min_jam} jam`;
    const hi = r.max_jam === null ? "" : `< ${r.max_jam} jam`;
    return [lo, hi].filter(Boolean).join(" dan ") || "selalu";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Aturan Refund</h1>
      <p className="mt-1 text-sm text-slate-600">
        Aturan dicocokkan berdasarkan sisa jam ke keberangkatan. Kosongkan batas bawah/atas untuk &quot;tak terbatas&quot;.
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2">
        <input className="rounded border px-3 py-2 md:col-span-2" placeholder="Nama aturan, mis. > 48 jam" value={nama} onChange={(e) => setNama(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="Batas bawah jam (kosong = ∞ bawah)" type="number" step="any" value={minJam} onChange={(e) => setMinJam(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="Batas atas jam (kosong = ∞ atas)" type="number" step="any" value={maxJam} onChange={(e) => setMaxJam(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="Persen refund (0–100)" type="number" min={0} max={100} value={persen} onChange={(e) => setPersen(e.target.value)} />
        <div className="flex gap-2">
          <button className="rounded bg-sky-700 px-4 py-2 text-white hover:bg-sky-600">{editId ? "Simpan" : "Tambah"}</button>
          {editId && <button type="button" onClick={reset} className="rounded bg-slate-200 px-4 py-2">Batal</button>}
        </div>
        {err && <p className="text-sm text-red-600 md:col-span-2">{err}</p>}
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-100 text-left"><th className="px-4 py-2">Nama</th><th className="px-4 py-2">Berlaku</th><th className="px-4 py-2">Refund</th><th className="px-4 py-2">Aksi</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.nama}</td>
                <td className="px-4 py-2">{label(r)}</td>
                <td className="px-4 py-2 font-semibold">{r.persen}%</td>
                <td className="px-4 py-2">
                  <button onClick={() => edit(r)} className="text-sky-700 hover:underline">Ubah</button>
                  {" | "}
                  <button onClick={() => hapus(r.id)} className="text-red-600 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
