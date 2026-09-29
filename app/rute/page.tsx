"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

interface Rute { id: number; asal: string; tujuan: string; harga: number; }

export default function RutePage() {
  const [rows, setRows] = useState<Rute[]>([]);
  const [asal, setAsal] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [harga, setHarga] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const load = () => fetch("/api/rute").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  const reset = () => { setAsal(""); setTujuan(""); setHarga(""); setEditId(null); setErr(""); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const body = { asal, tujuan, harga: Number(harga) };
    const res = await fetch(editId ? `/api/rute/${editId}` : "/api/rute", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { setErr((await res.json()).error ?? "Gagal menyimpan"); return; }
    reset(); load();
  }

  async function hapus(id: number) {
    if (!confirm("Hapus rute ini?")) return;
    const res = await fetch(`/api/rute/${id}`, { method: "DELETE" });
    if (!res.ok) alert((await res.json()).error ?? "Gagal menghapus");
    load();
  }

  function edit(r: Rute) {
    setEditId(r.id); setAsal(r.asal); setTujuan(r.tujuan); setHarga(String(r.harga));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Master Rute</h1>
      <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl bg-white p-5 shadow-sm md:grid-cols-4">
        <input className="rounded border px-3 py-2" placeholder="Kota asal" value={asal} onChange={(e) => setAsal(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="Kota tujuan" value={tujuan} onChange={(e) => setTujuan(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="Harga (Rp)" type="number" min={0} value={harga} onChange={(e) => setHarga(e.target.value)} />
        <div className="flex gap-2">
          <button className="rounded bg-sky-700 px-4 py-2 text-white hover:bg-sky-600">{editId ? "Simpan" : "Tambah"}</button>
          {editId && <button type="button" onClick={reset} className="rounded bg-slate-200 px-4 py-2">Batal</button>}
        </div>
        {err && <p className="text-sm text-red-600 md:col-span-4">{err}</p>}
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-100 text-left"><th className="px-4 py-2">Asal</th><th className="px-4 py-2">Tujuan</th><th className="px-4 py-2">Harga</th><th className="px-4 py-2">Aksi</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.asal}</td>
                <td className="px-4 py-2">{r.tujuan}</td>
                <td className="px-4 py-2">{rupiah(r.harga)}</td>
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
