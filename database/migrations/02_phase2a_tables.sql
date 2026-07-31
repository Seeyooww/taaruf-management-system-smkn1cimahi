-- SQL Migration: Phase 2A Master Data & Settings Tables

-- 1. Kelompok Table
create table if not exists public.kelompok (
    id uuid primary key default gen_random_uuid(),
    nomor_kelompok integer not null unique,
    kelas text not null,
    username text not null unique,
    created_at timestamptz not null default now()
);

-- 2. Anggota Table
create table if not exists public.anggota (
    id uuid primary key default gen_random_uuid(),
    kelompok_id uuid not null references public.kelompok(id) on delete cascade,
    nama text not null,
    jenis_kelamin text not null check (jenis_kelamin in ('L', 'P')),
    aktif boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists idx_anggota_kelompok on public.anggota(kelompok_id);
create index if not exists idx_anggota_aktif on public.anggota(aktif);

-- 3. Kating Table
create table if not exists public.kating (
    id uuid primary key default gen_random_uuid(),
    nama text not null,
    kelas text not null,
    jenis_kelamin text not null check (jenis_kelamin in ('L', 'P')),
    nomor_whatsapp text not null,
    aktif boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists idx_kating_aktif on public.kating(aktif);
create index if not exists idx_kating_jk on public.kating(jenis_kelamin);

-- 4. Settings Table
create table if not exists public.settings (
    id uuid primary key default gen_random_uuid(),
    nama_acara text not null default 'Taaruf SMKN 1 Cimahi',
    tahun integer not null default 2026,
    target_kating integer not null default 5,
    minimal_durasi integer not null default 30,
    tanggal_mulai date not null default current_date,
    tanggal_selesai date not null default (current_date + interval '7 days'),
    updated_at timestamptz not null default now()
);

-- 5. Slot Waktu Table
create table if not exists public.slot_waktu (
    id uuid primary key default gen_random_uuid(),
    nama_slot text not null,
    jam_mulai text not null,
    jam_selesai text not null,
    urutan integer not null default 1,
    aktif boolean not null default true
);

-- 6. WhatsApp Templates Table
create table if not exists public.whatsapp_templates (
    id uuid primary key default gen_random_uuid(),
    nama_template text not null,
    isi_template text not null,
    created_at timestamptz not null default now()
);

-- 7. Announcements Table
create table if not exists public.announcements (
    id uuid primary key default gen_random_uuid(),
    judul text not null,
    isi text not null,
    aktif boolean not null default true,
    created_at timestamptz not null default now()
);

-- 8. Booking Table (Structure Only for Phase 2A)
create table if not exists public.booking (
    id uuid primary key default gen_random_uuid(),
    kelompok_id uuid not null references public.kelompok(id),
    tanggal date not null,
    slot_id uuid not null references public.slot_waktu(id),
    kating_laki_id uuid references public.kating(id),
    kating_perempuan_id uuid references public.kating(id),
    status text not null check (status in ('Draft', 'Menunggu Konfirmasi', 'Disetujui', 'Ditolak', 'Selesai', 'Tidak Dihitung', 'Dibatalkan')),
    catatan text,
    created_at timestamptz not null default now()
);

-- 9. Booking Participants Table (Structure Only for Phase 2A)
create table if not exists public.booking_participants (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid not null references public.booking(id) on delete cascade,
    anggota_id uuid not null references public.anggota(id) on delete cascade,
    hadir boolean not null default false
);

-- 10. Progress Table (Structure Only for Phase 2A)
create table if not exists public.progress (
    id uuid primary key default gen_random_uuid(),
    anggota_id uuid not null references public.anggota(id) on delete cascade,
    booking_id uuid not null references public.booking(id),
    kating_id uuid not null references public.kating(id),
    created_at timestamptz not null default now()
);

-- Default Initial Seeds
insert into public.settings (nama_acara, tahun, target_kating, minimal_durasi, tanggal_mulai, tanggal_selesai)
values ('Taaruf SMKN 1 Cimahi 2026', 2026, 5, 30, '2026-08-01', '2026-08-07')
on conflict do nothing;

insert into public.slot_waktu (nama_slot, jam_mulai, jam_selesai, urutan, aktif)
values 
    ('Istirahat 1', '09:30', '10:00', 1, true),
    ('Istirahat 2', '12:00', '12:45', 2, true),
    ('Istirahat 3', '15:15', '15:45', 3, true),
    ('Pulang', '16:00', '16:30', 4, true)
on conflict do nothing;

insert into public.whatsapp_templates (nama_template, isi_template)
values 
    ('Konfirmasi Booking', 'Halo Akang {{akang}} & Teteh {{teteh}}, kami dari {{kelompok}} mengajukan sesi Taaruf pada hari {{hari}}, slot {{slot}}. Mohon konfirmasinya. Terima kasih!'),
    ('Pengingat Sesi', 'Pengingat sesi Taaruf untuk {{kelompok}} dengan {{akang}} & {{teteh}} pada {{hari}} slot {{slot}}.')
on conflict do nothing;

insert into public.announcements (judul, isi, aktif)
values 
    ('Selamat Datang Peserta Taaruf 2026', 'Jadwal sesi Taaruf akan segera dibuka. Harap perhatikan informasi dari pembimbing kelompok.', true)
on conflict do nothing;
