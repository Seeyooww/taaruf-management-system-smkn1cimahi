-- ============================================================
-- SEED: Anggota Kelompok
-- Jalankan di Supabase SQL Editor SETELAH import kelompok CSV
-- Kelompok 06: Dena dari Kelas B (khusus, ditempatkan di kelompok Kelas A)
-- Kelompok 14: Seo Daffaa dari Kelas A (khusus, ditempatkan di kelompok Kelas B)
-- ============================================================

-- Hapus data anggota lama jika ada (opsional, hati-hati di production)
-- DELETE FROM anggota;

INSERT INTO anggota (kelompok_id, nama, jenis_kelamin, aktif)
SELECT k.id, v.nama, v.jenis_kelamin::text, true
FROM (VALUES
  -- Kelompok 01 (Kelas A)
  (1, 'Faris', 'L'),
  (1, 'Yusuf', 'L'),
  (1, 'Amirah', 'P'),
  (1, 'M.Dika Kelana', 'L'),

  -- Kelompok 02 (Kelas A)
  (2, 'Zulfikar', 'L'),
  (2, 'Sinta', 'P'),
  (2, 'Radit', 'L'),
  (2, 'M.Arham', 'L'),

  -- Kelompok 03 (Kelas A)
  (3, 'Khalif', 'L'),
  (3, 'Kiran Anggara', 'L'),
  (3, 'Sefti', 'P'),
  (3, 'Fauzi Hasbi', 'L'),

  -- Kelompok 04 (Kelas A)
  (4, 'Adinda', 'P'),
  (4, 'Aliyah', 'P'),
  (4, 'Daffa', 'L'),
  (4, 'Ahmad Fauzi', 'L'),

  -- Kelompok 05 (Kelas A)
  (5, 'Raisya', 'P'),
  (5, 'Luthfi', 'P'),
  (5, 'M.Andika', 'L'),
  (5, 'Dhawy', 'L'),

  -- Kelompok 06 (Kelas A + Dena dari Kelas B — khusus)
  (6, 'Nuraini Bulan', 'P'),
  (6, 'Rizky', 'L'),
  (6, 'M. Fadlan', 'L'),
  (6, 'Dena', 'P'),  -- dari Kelas B, ditempatkan khusus di kelompok 06

  -- Kelompok 07 (Kelas A)
  (7, 'Rifa', 'P'),
  (7, 'Ferlita', 'P'),
  (7, 'Reifan', 'L'),
  (7, 'Ghiyat', 'L'),

  -- Kelompok 08 (Kelas A)
  (8, 'Shifa', 'P'),
  (8, 'Kirana', 'P'),
  (8, 'Resa', 'L'),
  (8, 'Arkan', 'L'),

  -- Kelompok 09 (Kelas A, 3 anggota)
  (9, 'M.Farrel', 'L'),
  (9, 'Bima', 'L'),
  (9, 'Luna', 'P'),

  -- Kelompok 10 (Kelas A, 3 anggota)
  (10, 'Ahmad Haikal', 'L'),
  (10, 'Ramadhan', 'L'),
  (10, 'Cantika', 'P'),

  -- Kelompok 11 (Kelas B)
  (11, 'Sachi Azaria', 'P'),
  (11, 'Alif Fakhri Setiawan', 'L'),
  (11, 'Bayu M Arsyad', 'L'),
  (11, 'Arya Ramza', 'L'),

  -- Kelompok 12 (Kelas B)
  (12, 'M Zidane', 'L'),
  (12, 'Rapli Pratama', 'L'),
  (12, 'Agni Nurmalasari', 'P'),
  (12, 'Fabian Daru', 'L'),

  -- Kelompok 13 (Kelas B)
  (13, 'Alfi Ramadhan', 'L'),
  (13, 'Mario Rafael', 'L'),
  (13, 'Rinjani', 'P'),
  (13, 'Senta Maya Lestari', 'P'),

  -- Kelompok 14 (Kelas B + Seo dari Kelas A — khusus)
  (14, 'Agista Anisa Putri', 'P'),
  (14, 'Seo Daffaa Pramudya', 'L'),  -- dari Kelas A, ditempatkan khusus di kelompok 14
  (14, 'Keisha Revita Putri', 'P'),
  (14, 'Mahzuz Alief', 'L'),

  -- Kelompok 15 (Kelas B)
  (15, 'Rajendra Raffa', 'L'),
  (15, 'Suni Salam', 'L'),
  (15, 'Fauzan Hafizh', 'L'),
  (15, 'Anisa Fitri Nugraeni', 'P'),

  -- Kelompok 16 (Kelas B)
  (16, 'Syafira', 'P'),
  (16, 'Andin Nesza', 'P'),
  (16, 'M Daffa Azrulloh', 'L'),
  (16, 'Yusuf Haris', 'L'),

  -- Kelompok 17 (Kelas B)
  (17, 'Mutia Safarotun', 'P'),
  (17, 'M Restu Prayogi', 'L'),
  (17, 'Luthfiani', 'P'),
  (17, 'Irfan Miftahul Iman', 'L'),

  -- Kelompok 18 (Kelas B)
  (18, 'Dhean Aleandha', 'L'),
  (18, 'M Fadli Budiman', 'L'),
  (18, 'Ghina Janeeta', 'P'),
  (18, 'Gilang Ramadhan', 'L'),

  -- Kelompok 19 (Kelas B, 3 anggota)
  (19, 'Syifa Oktaviani', 'P'),
  (19, 'Queensa Alea Kasta', 'P'),
  (19, 'Risky Aditya', 'L'),

  -- Kelompok 20 (Kelas B, 3 anggota)
  (20, 'Lana Rizqiya', 'P'),
  (20, 'Finzaghi Adriseva', 'L'),
  (20, 'Rino Setiyoriawan', 'L'),

  -- Kelompok 21 (Kelas C)
  (21, 'Vicka', 'P'),
  (21, 'Niken', 'P'),
  (21, 'Ammarulloh', 'L'),
  (21, 'Haidar', 'L'),

  -- Kelompok 22 (Kelas C)
  (22, 'Yoga', 'L'),
  (22, 'Vicky', 'L'),
  (22, 'Asti', 'P'),
  (22, 'Rega', 'L'),

  -- Kelompok 23 (Kelas C)
  (23, 'Corel', 'L'),
  (23, 'Malik Razaan', 'L'),
  (23, 'Lentera', 'P'),
  (23, 'Zianka', 'P'),

  -- Kelompok 24 (Kelas C)
  (24, 'Kenzie', 'L'),
  (24, 'Bagas', 'L'),
  (24, 'Almira', 'P'),
  (24, 'Shafira', 'P'),

  -- Kelompok 25 (Kelas C)
  (25, 'Fathan', 'L'),
  (25, 'Dzaki', 'L'),
  (25, 'Silvy', 'P'),
  (25, 'Ziyad', 'L'),

  -- Kelompok 26 (Kelas C)
  (26, 'Aline', 'P'),
  (26, 'Feiza', 'P'),
  (26, 'Firyal', 'L'),
  (26, 'Rizky Azhari', 'L'),

  -- Kelompok 27 (Kelas C)
  (27, 'Juliana', 'P'),
  (27, 'Mihran', 'L'),
  (27, 'Fajri', 'L'),
  (27, 'Farhan', 'L'),

  -- Kelompok 28 (Kelas C)
  (28, 'Rahma', 'P'),
  (28, 'Annastasya', 'P'),
  (28, 'Rasyid', 'L'),
  (28, 'Naufal', 'L'),

  -- Kelompok 29 (Kelas C, 3 anggota)
  (29, 'Vinza', 'P'),
  (29, 'Rizky Satria', 'L'),
  (29, 'Raup', 'L'),

  -- Kelompok 30 (Kelas C, 3 anggota)
  (30, 'Berryl', 'L'),
  (30, 'Ryu', 'L'),
  (30, 'Sarah', 'P')

) AS v(nomor, nama, jenis_kelamin)
JOIN kelompok k ON k.nomor_kelompok = v.nomor;
