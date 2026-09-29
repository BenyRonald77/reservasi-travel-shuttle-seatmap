"use client";
import { useEffect, useState } from "react";

interface Armada { id: number; nama: string; plat: string; jumlah_kursi: number; layout_kursi: string; }

export default function ArmadaPage() {
  const [rows, setRows] = useState<Armada[]>([]);
  const [nama, setNama] = useState("");
  const [plat, setPlat] = useState("");
  const [layout, setLayout] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const load = () => fetch("/api/armada").then((r) => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  const reset = () => { setNama(""); setPlat(""); setLayout(""); setEditId(null); setErr(""); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    let seats: string[];
    try {
      const parsed = JSON.parse(layout);
      if (!Array.isArray(parsed)) throw new Error();
      seats = parsed.map((s) => String(s));
    } catch {
      seats = layout.split(",").map((s) => s.trim()).filter(Boolean);
    }
    const res = await fetch(editId ? `/api/armada/${editId}` : "/api/armada", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, plat, layout_kursi: seats }),
    });
    if (!res.ok) { setErr((await res.json()).error ?? "Gagal menyimpan"); return; }
    reset(); load();
  }

  async function hapus(id: number) {
    if (!confirm("Hapus armada ini?")) return;
    const res = await fetch(`/api/armada/${id}`, { method: "DELETE" });
    if (!res.ok) alert((await res.json()).error ?? "Gagal menghapus");
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Master Armada</h1>
      <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2">
        <input className="rounded border px-3 py-2" placeholder="Nama armada" value={nama} onChange={(e) => setNama(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="Nomor plat" value={plat} onChange={(e) => setPlat(e.target.value)} />
        <div className="md:col-span-2">
          <input className="w-full rounded border px-3 py-2" placeholder='Layout kursi: JSON array mis. ["1A","1B","2A","2B"] atau pisahkan koma' value={layout} onChange={(e) => setLayout(e.target.value)} disabled={editId !== null} />
          <p className="mt-1 text-xs text-slate-500">Layout hanya bisa diisi saat tambah baru (tidak bisa diubah setelah dipakai).</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded bg-sky-700 px-4 py-2 text-white hover:bg-sky-600">{editId ? "Simpan" : "Tambah"}</button>
          {editId && <button type="button" onClick={reset} className="rounded bg-slate-200 px-4 py-2">Batal</button>}
        </div>
        {err && <p className="text-sm text-red-600 md:col-span-2">{err}</p>}
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-100 text-left"><th className="px-4 py-2">Nama</th><th className="px-4 py-2">Plat</th><th className="px-4 py-2">Kursi</th><th className="px-4 py-2">Layout</th><th className="px-4 py-2">Aksi</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.nama}</td>
                <td className="px-4 py-2">{r.plat}</td>
                <td className="px-4 py-2">{r.jumlah_kursi}</td>
                <td className="px-4 py-2 max-w-xs truncate text-slate-600">{r.layout_kursi}</td>
                <td className="px-4 py-2">
                  <button onClick={() => { setEditId(r.id); setNama(r.nama); setPlat(r.plat); setLayout(r.layout_kursi); }} className="text-sky-700 hover:underline">Ubah</button>
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
