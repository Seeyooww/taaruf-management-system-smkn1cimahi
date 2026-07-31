# Panduan Deployment Production (Vercel + Supabase)

Dokumen ini berisi panduan teknis operasional lengkap untuk mendeploy **Taaruf Management System (TMS)** ke platform Vercel dengan database Supabase Production.

---

## 1. Perintah Dasar

### Install Dependensi
```bash
npm install
```

### Jalankan Mode Development
```bash
npm run dev
```
Aplikasi dapat diakses melalui `http://localhost:3000`.

### Build Bundle Production
```bash
npm run build
```

### Jalankan Server Production
```bash
npm start
```

---

## 2. List Environment Variables Production

Buat file `.env.production` atau inputkan variabel berikut pada dashboard Vercel & Supabase:

| Nama Variable | Deskripsi | Contoh Nilai |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Endpoint Supabase Production | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon Key Supabase | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (Privat) | `eyJhbGciOi...` |
| `JWT_SECRET` | Secret Key Sign Token Session | `super-secret-jwt-token-prod-2026` |
| `NEXT_PUBLIC_APP_NAME` | Nama Resmi Aplikasi | `Taaruf Management System` |
| `NEXT_PUBLIC_APP_URL` | Domain Resmi Vercel Production | `https://tms-smkn1cimahi.vercel.app` |

---

## 3. Langkah Deploy ke Supabase Production

1. **Buat Project Supabase Baru**:
   - Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
   - Catat `Database Password`, `API URL`, `anon key`, dan `service_role key`.

2. **Eksekusi Schema Migration**:
   - Buka menu **SQL Editor** di Supabase Dashboard.
   - Buka file migration di repository `database/schema.sql`.
   - Paste dan jalankan script SQL untuk membuat tabel: `settings`, `kelompok`, `anggota`, `kating`, `slot_waktu`, `whatsapp_templates`, `announcements`, `booking`, `booking_participants`, `progress_records`.

3. **Konfigurasi Row Level Security (RLS)**:
   - Pastikan RLS diaktifkan untuk perlindungan data sesuai kebijakan akses.

---

## 4. Langkah Deploy ke Vercel

1. **Hubungkan Repository ke Vercel**:
   - Login ke [Vercel Dashboard](https://vercel.com/dashboard).
   - Klik **Add New...** &rarr; **Project**.
   - Pilih repository GitHub `Taaruf Web`.

2. **Konfigurasi Environment Variables**:
   - Di bagian **Environment Variables**, tambahkan seluruh variabel dari daftar di atas:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `JWT_SECRET`
     - `NEXT_PUBLIC_APP_NAME`
     - `NEXT_PUBLIC_APP_URL`

3. **Trigger Deployment**:
   - Klik **Deploy**. Vercel akan otomatis melakukan linting, TypeScript typechecking, dan kompilasi bundle Next.js Production.

---

## 5. Prosedur Backup & Restore Database

### Prosedur Export Backup JSON
1. Login sebagai Admin pada sistem.
2. Buka menu **Pengaturan &rarr; Backup & Restore** (`/admin/pengaturan/backup`).
3. Klik **Unduh File Backup JSON**.
4. Simpan file `tms_backup_YYYY-MM-DD.json` di tempat yang aman.

### Prosedur Restore Database JSON
1. Login sebagai Admin.
2. Buka menu **Pengaturan &rarr; Backup & Restore**.
3. Unggah atau tempel isi file `.json` backup.
4. Klik **Pulihkan Database Dari JSON**.

---

## 6. Checklist Verifikasi Production

- [x] Security Headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) terkonfigurasi.
- [x] Sitemap (`sitemap.xml`) & Robots (`robots.txt`) aktif.
- [x] Web App Manifest (`manifest.webmanifest`) aktif.
- [x] Custom Error Boundary (`error.tsx`, `global-error.tsx`) & 404 (`not-found.tsx`) terpasang.
- [x] Production Logger (`logger.ts`) aktif.
