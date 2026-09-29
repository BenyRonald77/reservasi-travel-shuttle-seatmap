# Reservasi Travel & Shuttle — Seat Map

Reservasi kursi travel/shuttle dengan denah kursi interaktif, tahan kursi
(hold) 10 menit, booking dengan kode unik, manifes print-friendly, dan
pembatalan dengan refund bertingkat yang bisa dikonfigurasi.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

## Halaman

- `/` — Dashboard: statistik rute/armada/keberangkatan/booking + jadwal terdekat
- `/booking` — Pilih keberangkatan → denah kursi interaktif → tahan kursi (timer 10 menit) → isi data penumpang → booking
- `/pembatalan` — Cari booking → cek estimasi refund → konfirmasi pembatalan
- `/keberangkatan` — CRUD jadwal keberangkatan
- `/rute` — CRUD master rute
- `/armada` — CRUD master armada (layout kursi JSON)
- `/refund-rules` — CRUD aturan refund bertingkat
- `/manifes/[id]` — Manifes penumpang print-friendly + tombol cetak

## API

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/POST | /api/rute | List / tambah rute |
| GET/PUT/DELETE | /api/rute/[id] | Detail / ubah / hapus |
| GET/POST | /api/armada | List / tambah armada |
| GET/PUT/DELETE | /api/armada/[id] | Detail / ubah / hapus |
| GET/POST | /api/keberangkatan | List (`?upcoming=1`) / tambah |
| GET/PUT/DELETE | /api/keberangkatan/[id] | Detail / ubah / hapus |
| GET | /api/keberangkatan/[id]/seats | Peta kursi (lazy cleanup hold expired) |
| POST/DELETE | /api/keberangkatan/[id]/hold | Tahan / lepas hold kursi |
| GET | /api/keberangkatan/[id]/manifes | Manifes JSON |
| GET/POST | /api/bookings | List (`?keberangkatan_id=`, `?kode=`) / booking baru |
| POST | /api/bookings/[id]/cancel | Batalkan (`{preview:true}` untuk estimasi) |
| POST | /api/holds/cleanup | Hapus semua hold kedaluwarsa |
| GET/POST | /api/refund-rules | List / tambah aturan refund |
| GET/PUT/DELETE | /api/refund-rules/[id] | Detail / ubah / hapus |

## Aturan bisnis

- Kursi hanya bisa di-booking oleh holder yang menahan kursi tersebut (validasi `holder_id`).
- Satu kursi = satu booking aktif atau satu hold aktif per keberangkatan (409 jika konflik).
- Hold kedaluwarsa 10 menit; dibersihkan lazy saat peta kursi diminta + endpoint manual.
- Refund dihitung dari sisa jam nyata ke keberangkatan vs aturan refund (default: >48 jam → 90%, 24–48 jam → 50%, <24 jam → 0%).
