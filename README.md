# TEANOL - Sistem Kartu Member Otomatis

Aplikasi web untuk mendaftarkan member **TEANOL (The Real Thai Tea)**, secara otomatis
membuatkan kartu member dalam format **PDF** bertema warna kuning dengan logo TEANOL,
serta menyimpan dan merekap seluruh data member menggunakan **MySQL**.

## Fitur

- Form pendaftaran member (nama, no. HP, email, alamat, tanggal bergabung)
- Setiap member otomatis mendapat **ID Member unik** (format: `TEANOL-2026-00001`)
- Kartu member otomatis dibuat dalam format **PDF 2 sisi (bolak-balik)**: sisi depan bertema kuning
  dengan logo & data member, sisi belakang bertema gelap berisi **barcode (Code128)** ID Member untuk dipindai kasir
- **Sistem poin member**: setiap pembelian 1 minuman = **10 poin**, otomatis bertambah ke akun member
- Halaman **Input Pembelian** untuk mencatat transaksi dan menambah poin member — bisa pilih
  member dari dropdown **atau langsung scan barcode kartu member** lewat kamera
- Halaman **Tukar Poin** — member bisa menukar poin dengan hadiah dari katalog (atau hadiah custom),
  poin otomatis berkurang, lengkap dengan riwayat penukaran — juga mendukung **scan barcode member**
- Halaman **Scan Member** — arahkan kamera ke barcode di kartu member untuk langsung melihat
  nama, ID, dan poin member saat ini, lalu lanjut ke Input Pembelian / Tukar Poin dengan satu klik
- Halaman **Rekap Member** untuk melihat seluruh data, poin tiap member, statistik jumlah member & total poin, unduh ulang kartu, dan hapus member
- Data tersimpan permanen di database **MySQL** (termasuk riwayat pembelian & penukaran poin)

## Struktur Proyek

```
teanol-member-card/
├── config/
│   └── db.js               # Koneksi ke MySQL
├── routes/
│   ├── members.js          # API: create, read, update, delete member
│   ├── purchases.js         # API: catat pembelian & tambah poin otomatis
│   ├── rewards.js            # API: katalog hadiah yang bisa ditukar poin
│   └── redemptions.js        # API: tukar poin member dengan hadiah
├── utils/
│   └── generateCard.js     # Generator kartu member PDF (pdfkit)
├── public/
│   ├── index.html           # Halaman form pendaftaran
│   ├── purchase.html         # Halaman input pembelian (penambah poin, ada tombol scan)
│   ├── redeem.html            # Halaman tukar poin dengan hadiah (ada tombol scan)
│   ├── scan.html               # Halaman Scan Member (scan barcode kartu via kamera)
│   ├── recap.html            # Halaman rekap/daftar member
│   ├── css/style.css        # Tema warna kuning TEANOL + tampilan scanner
│   ├── js/app.js            # Logika form pendaftaran
│   ├── js/purchase.js        # Logika halaman input pembelian + scan barcode
│   ├── js/redeem.js           # Logika halaman tukar poin + scan barcode
│   ├── js/recap.js          # Logika halaman rekap
│   ├── js/scan.js             # Logika halaman Scan Member (kamera + lookup member)
│   └── images/logo.png      # Logo TEANOL
├── generated_cards/         # Tempat penyimpanan hasil kartu PDF (auto-generated)
├── database.sql             # Skema database MySQL (untuk instalasi baru)
├── migration_add_points.sql  # Migrasi: tambah fitur poin (untuk database lama)
├── migration_add_redeem.sql  # Migrasi: tambah fitur tukar poin (untuk database lama)
├── server.js                 # Entry point server Express
├── package.json
├── .env.example
└── README.md
```

## Teknologi yang Digunakan

- **Node.js + Express** — backend & server API
- **MySQL** (via `mysql2`) — database penyimpanan member
- **PDFKit** — pembuatan kartu member dalam format PDF
- **bwip-js** — pembuatan barcode Code128 yang ditempel pada kartu member
- **html5-qrcode** (dimuat via CDN di browser) — pemindaian barcode lewat kamera pada halaman Scan Member, Input Pembelian, dan Tukar Poin
- **HTML/CSS/JavaScript murni** — tampilan frontend (tanpa framework, ringan & mudah dibuka di VSCode)

## Persyaratan (Prasyarat)

Sebelum menjalankan, pastikan sudah terinstall di komputer:

1. **Node.js** versi 18 ke atas → cek dengan `node -v`
2. **MySQL Server** (bisa lewat XAMPP, MySQL Installer, atau MySQL Server langsung) → cek dengan `mysql --version`
3. **VSCode** (opsional, tapi disarankan untuk membuka & menjalankan proyek ini)

## Cara Menjalankan (Step by Step)

### 1. Buka Proyek di VSCode

Ekstrak/salin folder `teanol-member-card` lalu buka foldernya di VSCode:

```bash
code teanol-member-card
```

Buka terminal di dalam VSCode: `Terminal > New Terminal`.

### 2. Install Dependency

Di terminal VSCode, jalankan:

```bash
npm install
```

Perintah ini akan mengunduh `express`, `mysql2`, `pdfkit`, `bwip-js`, `dotenv`, dan `nodemon`.

> Catatan: pustaka pemindai barcode di browser (`html5-qrcode`) dimuat otomatis dari CDN saat
> halaman **Scan Member**, **Input Pembelian**, atau **Tukar Poin** dibuka, jadi tidak perlu
> di-install lewat npm — cukup pastikan perangkat yang membuka halaman tersebut terhubung internet
> (sekali saat pertama load) dan browser mengizinkan akses kamera.

### 3. Siapkan Database MySQL

Buka MySQL (lewat terminal, phpMyAdmin, atau MySQL Workbench), lalu jalankan isi file
`database.sql`. Contoh lewat terminal:

```bash
mysql -u root -p < database.sql
```

Atau jika memakai **phpMyAdmin**: buka tab **SQL**, salin-tempel isi `database.sql`, lalu jalankan.

Ini akan membuat database `teanol_db` beserta tabel `members`.

### 4. Konfigurasi Environment (.env)

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Lalu sesuaikan isinya dengan kredensial MySQL kamu, contoh:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=isi_password_mysql_kamu
DB_NAME=teanol_db
```

> Jika menggunakan XAMPP dengan setting default, biasanya `DB_USER=root` dan `DB_PASSWORD` dikosongkan.

### 5. Jalankan Server

Untuk mode pengembangan (otomatis restart saat ada perubahan kode):

```bash
npm run dev
```

Atau mode biasa:

```bash
npm start
```

Jika berhasil, akan muncul pesan:

```
TEANOL Member Card System
Server berjalan di: http://localhost:3000
```

### 6. Buka di Browser

- **Form Pendaftaran Member** → `http://localhost:3000/index.html`
- **Rekap Member** → `http://localhost:3000/recap.html`

## Sudah Pernah Install Sebelumnya? (Migrasi Fitur Poin)

Jika database `teanol_db` kamu **sudah pernah dibuat sebelum fitur poin ditambahkan**,
jangan jalankan ulang `database.sql` dari awal. Cukup jalankan file migrasi berikut:

Lewat phpMyAdmin: buka database kamu → tab **SQL** → salin-tempel isi file
`migration_add_points.sql` → klik **Go**.

Atau lewat terminal:

```bash
mysql -u root -p teanol_db < migration_add_points.sql
```

> Catatan: kalau nama database kamu bukan `teanol_db` (misalnya `teanol`), buka file
> `migration_add_points.sql` dan ubah baris `USE teanol_db;` menjadi nama database kamu.

File ini akan menambahkan kolom `points` ke tabel `members` dan membuat tabel baru
`purchases` untuk mencatat riwayat pembelian, tanpa menghapus data member yang sudah ada.

Jika kamu **juga** ingin fitur **Tukar Poin**, lanjutkan dengan menjalankan
`migration_add_redeem.sql` dengan cara yang sama (lewat phpMyAdmin tab SQL, atau
`mysql -u root -p teanol_db < migration_add_redeem.sql`). File ini membuat tabel
`rewards` (katalog hadiah, sudah diisi beberapa contoh) dan `redemptions` (riwayat
penukaran poin).

## Alur Penggunaan

1. Buka halaman **Daftar Member**, isi nama, no. HP, email, alamat, dan tanggal bergabung.
2. Klik **"Daftarkan & Buat Kartu"**.
3. Sistem otomatis: menyimpan data ke MySQL → membuat ID member unik → men-generate kartu PDF bertema kuning TEANOL dengan logo.
4. Muncul tombol **"Unduh Kartu Member (PDF)"** untuk mengunduh kartu yang baru dibuat.
5. Setiap kali member membeli minuman, buka halaman **Input Pembelian**, pilih member dari dropdown, isi jumlah minuman yang dibeli, lalu klik **"Catat Pembelian & Tambah Poin"**. Poin otomatis bertambah **10 poin per minuman**.
6. Ketika member ingin menukar poin dengan hadiah, buka halaman **Tukar Poin**, pilih member, pilih hadiah dari katalog (atau isi hadiah custom), lalu klik **"Tukar Poin Sekarang"**. Poin otomatis berkurang dan tercatat di riwayat penukaran. Kamu juga bisa menambah hadiah baru ke katalog langsung dari halaman ini.
7. Buka halaman **Rekap Member** untuk melihat seluruh member yang sudah terdaftar, poin masing-masing member, statistik total member/member baru bulan ini/total poin, mengunduh ulang kartu, atau menghapus member.

## Fitur Scan Barcode Member

Setiap kartu member PDF kini adalah **PDF 2 halaman (bolak-balik)**:

- **Halaman 1 (sisi depan)** — desain kuning khas TEANOL: logo, nama member, ID Member, tanggal bergabung.
- **Halaman 2 (sisi belakang)** — tema gelap dengan **barcode (Code128)** besar berisi ID Member,
  ditempatkan di kotak putih agar kontras dan mudah dipindai, lengkap dengan ID Member yang bisa dibaca manual di bawahnya.

Saat kartu dibuka di aplikasi PDF (Adobe Reader, browser, dsb.), halaman pertama yang tampil adalah sisi depan, geser/scroll ke halaman berikutnya untuk melihat sisi belakang berisi barcode. Jika ingin mencetak kartu fisik bolak-balik, cetak PDF ini dengan opsi **"Print on both sides" / duplex (flip on short edge)** di dialog print, atau cetak halaman 1 dan halaman 2 terpisah lalu tempelkan punggung-ke-punggung.

- **Halaman Scan Member** (`/scan.html`): klik **"Mulai Scan Barcode"**, izinkan akses kamera saat diminta browser, lalu arahkan kamera ke barcode di **sisi belakang** kartu member (dari layar HP/print kartu). Setelah terbaca, nama, ID, dan poin member langsung tampil, lengkap dengan tombol pintasan ke **Input Pembelian** dan **Tukar Poin** untuk member tersebut. Jika kamera tidak tersedia, ID Member juga bisa diketik manual di kolom pencarian.
- **Halaman Input Pembelian & Tukar Poin**: tersedia tombol **"Scan Barcode Member"** di atas form. Setelah barcode terbaca, member yang sesuai otomatis terpilih di dropdown tanpa perlu mencari manual.
- Barcode dibaca melalui kamera perangkat (laptop/HP) menggunakan pustaka `html5-qrcode` di browser — tidak memerlukan alat scanner khusus, namun beberapa scanner barcode fisik USB juga tetap bisa dipakai karena umumnya bekerja seperti keyboard (ketik otomatis ke kolom ID Member manual lalu tekan Enter).
- **Kartu member yang dibuat sebelum fitur ini ditambahkan** belum memiliki sisi belakang/barcode. Untuk membuatnya ulang, panggil endpoint update member (`PUT /api/members/:id`) — misalnya lewat form edit yang kamu buat sendiri, atau minta member daftar ulang datanya lewat halaman pendaftaran — supaya kartu PDF-nya dibuat ulang lengkap dengan sisi belakang berbarcode.

## Kartu member PDF disimpan di mana?

Semua file PDF kartu member otomatis disimpan di folder `generated_cards/` dan
tersedia untuk diunduh via `http://localhost:3000/cards/<ID_MEMBER>.pdf`.

## Kustomisasi

- **Warna tema**: ubah variabel warna di `public/css/style.css` (`--teanol-yellow`, `--teanol-dark`, dst.) dan di `utils/generateCard.js` (`YELLOW`, `DARK`).
- **Desain kartu**: ubah tata letak teks/posisi di `utils/generateCard.js`.
- **Logo**: ganti file `public/images/logo.png` dengan logo baru (disarankan ukuran persegi, background transparan).
- **Format ID Member**: ubah fungsi `generateMemberCode()` di `routes/members.js`.
- **Jumlah poin per minuman**: ubah nilai `POINTS_PER_ITEM` di `routes/purchases.js` (saat ini `10`).
- **Katalog hadiah tukar poin**: tambah/ubah langsung lewat halaman "Tukar Poin" (form "Tambah Hadiah ke Katalog"), atau edit tabel `rewards` langsung di database.

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `Error: connect ECONNREFUSED` | Pastikan MySQL server sudah berjalan (start service MySQL/XAMPP) |
| `ER_ACCESS_DENIED_ERROR` | Cek kembali `DB_USER` dan `DB_PASSWORD` di file `.env` |
| `ER_BAD_DB_ERROR: Unknown database 'teanol_db'` | Jalankan ulang `database.sql` (lihat langkah 3) |
| Port 3000 sudah dipakai | Ubah nilai `PORT` di file `.env`, misal `PORT=4000` |
| Logo tidak muncul di kartu PDF | Pastikan file `public/images/logo.png` ada dan tidak rusak |

---

&copy; 2026 TEANOL - The Real Thai Tea
