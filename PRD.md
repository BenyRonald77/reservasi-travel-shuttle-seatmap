# PRD — Reservasi Travel / Shuttle dengan Seat Map

Aplikasi reservasi kursi travel/shuttle: penumpang memilih kursi dari denah
interaktif, kursi ditahan (hold) sementara, booking diterbitkan dengan kode
unik, manifes keberangkatan bisa dicetak, dan pembatalan menghitung refund
bertingkat berdasarkan aturan yang bisa dikonfigurasi.

## Stack
- Next.js 14 (App Router) + TypeScript + Prisma 5.22 + SQLite + Tailwind
- Tanggal: TEXT `YYYY-MM-DD`, jam: TEXT `HH:MM`, timestamp: TEXT ISO
- Bahasa UI: Indonesia

## Model Data

| Model | Field |
|---|---|
| Rute | id, asal, tujuan, harga (Int, rupiah) |
| Armada | id, nama, plat, jumlah_kursi (Int), layout_kursi (TEXT JSON array, mis. `["1A","1B","2A","2B",...]`) |
| Keberangkatan | id, rute_id, armada_id, tanggal (YYYY-MM-DD), jam (HH:MM), driver |
| Booking | id, keberangkatan_id, kode_booking (unik, mis. `TRV-AB12CD`), nama_penumpang, telp, kursi, harga (Int, disalin dari rute saat booking), status (`booked`/`cancelled`), refund_rp (Int, 0 default), created_at (ISO) |
| SeatHold | id, keberangkatan_id, kursi, holder_id (TEXT), expires_at (ISO), created_at (ISO). Unik per (keberangkatan_id, kursi). |
| RefundRule | id, nama, min_jam (Float?, inklusif), max_jam (Float?, eksklusif), persen (Int) |

Aturan refund default (bisa diubah lewat UI/API):
1. > 48 jam sebelum berangkat → 90% (`min_jam=48, max_jam=null`)
2. 24–48 jam → 50% (`min_jam=24, max_jam=48`)
3. < 24 jam → 0% (`min_jam=null, max_jam=24`)

## Fitur

### F0 — Setup, schema, seed, dashboard
Schema Prisma + seed (2 rute, 2 armada 12 kursi, 3 keberangkatan, 3 aturan
refund default) + layout + dashboard (statistik + navigasi).

### F1 — Master data: rute, armada, keberangkatan
CRUD penuh lewat halaman + API:
- `GET/POST /api/rute`, `GET/PUT/DELETE /api/rute/[id]`
- `GET/POST /api/armada`, `GET/PUT/DELETE /api/armada/[id]` (layout_kursi sebagai JSON array)
- `GET/POST /api/keberangkatan`, `GET/PUT/DELETE /api/keberangkatan/[id]`

### F2 — Seat hold (tahan kursi)
- `POST /api/keberangkatan/[id]/hold {kursi, holder_id}` → 201 jika kursi bebas;
  409 jika kursi sudah di-book atau di-hold aktif oleh holder lain;
  400 jika kursi tidak ada di layout / parameter kurang; 404 jika keberangkatan tidak ada.
- Hold kedaluwarsa ~10 menit. Sebelum peta kursi dikembalikan, hold yang sudah
  kedaluwarsa dihapus dulu (lazy cleanup).
- `GET /api/keberangkatan/[id]/seats` → `{ kursi, layout: [{kursi, status: "tersedia"|"dihold"|"dipesan", holder_id?}] }`.
- `POST /api/holds/cleanup` → menghapus semua hold kedaluwarsa (manual).
- `DELETE /api/keberangkatan/[id]/hold {kursi, holder_id}` → melepas hold sendiri (200) / 404.

### F3 — Booking
- `POST /api/bookings {keberangkatan_id, kursi, nama, telp, holder_id}`:
  - 400 jika data kurang / kursi tidak ada di layout.
  - 409 jika tidak ada hold aktif milik holder_id untuk kursi itu
    (kursi yang di-hold hanya bisa di-booking oleh holder yang sama).
  - Sukses (201): buat booking + kode unik `TRV-XXXXXX`, harga disalin dari
    rute, hold dihapus.
- `GET /api/bookings?keberangkatan_id=` → daftar booking.
- UI `/booking`: pilih keberangkatan → denah kursi interaktif (klik kursi
  tersedia → masukkan holder_id/nama → tahan) → timer sisa hold → isi data
  penumpang → booking → tampilkan kode booking.

### F4 — Manifes
- `GET /api/keberangkatan/[id]/manifes` → JSON: info rute/armada/driver/tanggal/jam + daftar penumpang per kursi.
- Halaman `/manifes/[keberangkatan_id]`: print-friendly, tombol cetak.

### F5 — Pembatalan + refund bertingkat
- `POST /api/bookings/[id]/cancel {preview?: boolean}`:
  - 404 jika booking tidak ada; 409 jika sudah cancelled; 400 jika keberangkatan sudah lewat.
  - Hitung selisih jam ke keberangkatan → cari RefundRule yang cocok
    (`min_jam <= jam < max_jam`, null = tak terbatas) → refund_rp = round(harga × persen/100).
  - `preview: true` → kembalikan estimasi tanpa mengubah data.
  - Tanpa preview → status `cancelled` + `refund_rp` terisi.
- Halaman `/pembatalan`: cari booking (kode/nama), tampilkan estimasi refund,
  konfirmasi pembatalan.
- Aturan refund bisa diubah lewat halaman `/refund-rules` + CRUD `/api/refund-rules`.

## Aturan bisnis penting
- Satu kursi hanya bisa dimiliki satu booking aktif atau satu hold aktif per keberangkatan.
- Booking wajib didahului hold oleh holder yang sama (mencegah race condition).
- Refund dihitung dari selisih jam nyata ke waktu keberangkatan, bukan dari waktu booking.
- Hold kedaluwarsa dibersihkan secara lazy (saat peta kursi/hold diminta) dan bisa manual.
