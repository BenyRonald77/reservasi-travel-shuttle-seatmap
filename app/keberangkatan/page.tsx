"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTanggal, today } from "@/lib/format";

interface Keberangkatan {
  id: number; tanggal: string; jam: string; driver: string;
  rute: { asal: string; tujuan: string };
  armada: { nama: string };
}

export default function KeberangkatanPage() {
  const [rows, setRows] = useState<Keberangkatan[]>([]);
  const [rutes, setRutes] = useState<{ id: number; asal: string; tujuan: string }[]>([]);
  const [armadas, setArmadas] = useState<{ id: number; nama: string }[]>([]);
  const [form, setForm] = useState({ rute_id: "", armada_id: "", tanggal: today(), jam: "07:00", driver: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const load = () => fetch("/api/keberangkatan").then((r) => r.json()).then(setRows);
  useEffect(() => {
    load();
    fetch("/api/rute").then((r) => r.json()).then(setRutes);
    fetch("/api/armada").then((r) => r.json()).then(setArmadas);
  }, []);

  const reset = () => { setForm({ rute_id: "", armada_id: "", tanggal: today(), jam: "07:00", driver: "" }); setEditId(null); setErr(""); };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const body = { ...form, rute_id: Number(form.rute_id), armada_id: Number(form.armada_id) };
    const res = await fetch(editId ? `/api/keberangkatan/${editId}` : "/api/keberangkatan", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { setErr((await res.json()).error ?? "Gagal menyimpan"); return; }
    reset(); load();
  }

  async function hapus(id: number) {
    if (!confirm("Hapus keberangkatan ini?")) return;
    const res = await fetch(`/api/keberangkatan/${id}`, { method: "DELETE" });
    if (!res.ok) alert((await res.json()).error ?? "Gagal menghapus");
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Jadwal Keberangkatan</h1>
      <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl bg-white p-5 shadow-sm md:grid-cols-3">
        <select className="rounded border px-3 py-2" value={form.rute_id} onChange={set("rute_id")}>
          <option value="">— Pilih rute —</option>
          {rutes.map((r) => <option key={r.id} value={r.id}>{r.asal} → {r.tujuan}</option>)}
        </select>
        <select className="rounded border px-3 py-2" value={form.armada_id} onChange={set("armada_id")}>
          <option value="">— Pilih armada —</option>
          {armadas.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
        </select>
        <input type="date" className="rounded border px-3 py-2" value={form.tanggal} onChange={set("tanggal")} />
        <input type="time" className="rounded border px-3 py-2" value={form.jam} onChange={set("jam")} />
        <input className="rounded border px-3 py-2" placeholder="Nama driver" value={form.driver} onChange={set("driver")} />
        <div className="flex gap-2">
          <button className="rounded bg-sky-700 px-4 py-2 text-white hover:bg-sky-600">{editId ? "Simpan" : "Tambah"}</button>
          {editId && <button type="button" onClick={reset} className="rounded bg-slate-200 px-4 py-2">Batal</button>}
        </div>
        {err && <p className="text-sm text-red-600 md:col-span-3">{err}</p>}
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-100 text-left"><th className="px-4 py-2">Tanggal</th><th className="px-4 py-2">Jam</th><th className="px-4 py-2">Rute</th><th className="px-4 py-2">Armada</th><th className="px-4 py-2">Driver</th><th className="px-4 py-2">Aksi</th></tr></thead>
          <tbody>
            {rows.map((k) => (
              <tr key={k.id} className="border-t">
                <td className="px-4 py-2">{formatTanggal(k.tanggal)}</td>
                <td className="px-4 py-2">{k.jam}</td>
                <td className="px-4 py-2">{k.rute.asal} → {k.rute.tujuan}</td>
                <td className="px-4 py-2">{k.armada.nama}</td>
                <td className="px-4 py-2">{k.driver}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <Link href={`/booking?keberangkatan_id=${k.id}`} className="text-sky-700 hover:underline">Booking</Link>
                  {" | "}
                  <Link href={`/manifes/${k.id}`} className="text-sky-700 hover:underline">Manifes</Link>
                  {" | "}
                  <button onClick={() => { setEditId(k.id); setForm({ rute_id: "", armada_id: "", tanggal: k.tanggal, jam: k.jam, driver: k.driver }); }} className="text-sky-700 hover:underline">Ubah</button>
                  {" | "}
                  <button onClick={() => hapus(k.id)} className="text-red-600 hover:underline">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
