# E-Office Monorepo (Tim 2)

Sistem E-Office terintegrasi dengan arsitektur monorepo menggunakan Bun workspaces untuk manajemen surat resmi akademik dan administrasi di lingkungan Fakultas Sains dan Matematika (FSM) Universitas Diponegoro.

## 📋 Deskripsi Proyek

E-Office adalah platform tata kelola surat elektronik dinas dan akademik terpadu yang dirancang untuk mengurangi penggunaan kertas (*paperless*) dan mempercepat alur birokrasi persetujuan. Sistem terdiri dari dua sub-aplikasi utama:
- **Backend API (e-office-api-v2)**: Layanan REST API berkinerja tinggi menggunakan Elysia.js, Prisma ORM, Better Auth, dan Casbin (RBAC).
- **Frontend Web (e-office-webapp-v2)**: Aplikasi web modern yang responsif menggunakan Next.js 16 (App Router), Tailwind CSS v4, dan Radix UI.

---

## 🏗️ Struktur Proyek

```
e-office-monorepo/
├── e-office-api-v2/          # Backend API (Elysia.js)
│   ├── src/                  # Source code utama
│   │   ├── routes/           # API Endpoints & Routing
│   │   ├── services/         # Logika Bisnis & Layanan
│   │   ├── middlewares/      # Interseptor & Middleware
│   │   └── lib/              # Pustaka utilitas (Auth, DB client, dll)
│   ├── prisma/               # Skema basis data PostgreSQL & Migrasi
│   └── casbin/               # Model otorisasi akses (RBAC)
│
├── e-office-webapp-v2/       # Frontend Web App (Next.js 16)
│   ├── src/
│   │   ├── app/              # Next.js App Router (Pages & Layouts)
│   │   ├── components/       # Komponen UI Reusable (shadcn/ui)
│   │   ├── context/          # State management global & formulir
│   │   ├── hooks/            # Custom React hooks (e.g. Upload, Auth)
│   │   └── lib/              # Utilitas API client (Eden Treaty) & IndexedDB
│   └── public/               # Aset statis & template surat
│
├── package.json              # Konfigurasi workspace monorepo & script global
└── tsconfig.base.json        # Berbagi konfigurasi TypeScript compiler
```

---

## 🚀 Quick Start & Workspace Scripts

Proyek ini telah dikonfigurasi dengan **Bun Workspaces**. Anda dapat menjalankan seluruh perintah development, migrasi database, seeding, dan build langsung dari **direktori root** tanpa perlu berpindah folder (`cd`) di terminal yang berbeda.

### Prasyarat System
- [Bun](https://bun.sh/) v1.1.6 atau lebih tinggi
- Node.js v20 atau lebih tinggi
- PostgreSQL database
- MinIO atau S3-compatible object storage

### 1. Instalasi Dependensi
Jalankan perintah berikut di direktori root monorepo:
```bash
bun install
```

### 2. Setup Environment Variables
Buat berkas `.env` untuk masing-masing aplikasi dengan menyalin contoh yang tersedia:
```bash
# Salin konfigurasi backend
cp e-office-api-v2/.env.example e-office-api-v2/.env

# Salin konfigurasi frontend
cp e-office-webapp-v2/.env.example e-office-webapp-v2/.env
```
> [!IMPORTANT]
> Sesuaikan konfigurasi port, koneksi database PostgreSQL, kredensial S3/MinIO, dan SSO Client ID sesuai dengan alokasi Tim 2 Anda sebelum menjalankan aplikasi.

### 3. Setup Database & Seeding
Jalankan migrasi schema dan seeding data master/demo dari direktori root:
```bash
# Jalankan migrasi database
bun db:migrate

# Masukkan data demo dan konfigurasi awal (seed)
bun db:seed
```

### 4. Menjalankan Server Development
Untuk menjalankan Backend API dan Frontend Web secara bersamaan secara paralel:
```bash
bun dev
```
Atau jika Anda ingin menjalankannya secara terpisah di terminal yang berbeda:
```bash
# Menjalankan Backend API saja (Port: 20022)
bun dev:api

# Menjalankan Frontend Web saja (Port: 20021)
bun dev:web
```

---

## ⚙️ Ringkasan Port & URL Layanan (Tim 2)

| Layanan / Console | URL Lokal | Kredensial Default | Deskripsi |
|-------------------|-----------|---------------------|-----------|
| **Frontend Web** | `http://localhost:20021` | Lihat Demo Akun di bawah | Aplikasi Client Utama |
| **Backend API** | `http://localhost:20022` | - | REST API Endpoint |
| **API Swagger Docs**| `http://localhost:20022/swagger` | - | Dokumentasi API Interaktif |
| **Prisma Studio** | `http://localhost:5555` | - | GUI Penjelajah Database (Jalankan `bun db:studio`) |
| **pgAdmin Console**| `http://localhost:5050` | `admin@example.com` / `admin` | GUI Manajemen PostgreSQL |
| **MinIO Console** | `http://localhost:9001` | `minioadmin` / `minioadmin` | GUI Object Storage |

---

## 🔐 Demo User Accounts

Setelah menjalankan `bun db:seed`, Anda dapat menggunakan akun demo berikut untuk menguji alur kerja persuratan (*approval workflow*):

| Role | Email | Password | Alur Tanggung Jawab |
|------|-------|----------|---------------------|
| **Super Admin** | `superadmin@fsm.internal` | `password1234` | Manajemen Master Data & Role/Permission |
| **Mahasiswa** (Pemohon) | `mahasiswa@demo.local` | `password1234` | Inisiasi draft & pengajuan surat |
| **Supervisor Akademik** | `sa@demo.local` | `password1234` | Verifikasi dokumen pengajuan mahasiswa |
| **Manajer TU** | `mtu@demo.local` | `password1234` | Peninjauan akhir & penandatanganan surat resmi |
| **UPA** (Unit Pelaksana Akademik)| `upa@demo.local` | `password1234` | Pemberian nomor surat keluar & pengarsipan PDF |

---

## 📦 Teknologi Stack

### Backend (`e-office-api-v2`)

- **Bun Runtime** (^1.3.2) - JavaScript/TypeScript runtime & package manager super cepat.
- **Elysia.js** (^1.4.19) - Web framework TypeScript modern dengan dukungan schema validation ketat.
- **Prisma ORM** (^6.19.0) - Object-relational mapping deklaratif terintegrasi dengan PostgreSQL.
- **Better Auth** (^1.4.6) - Pustaka autentikasi tangguh dengan sistem sesi aman.
- **Casbin** (^5.45.0) - Pustaka otorisasi berbasis kebijakan formal (RBAC).
- **MinIO S3 Client** (^8.0.6) - Penyimpanan berkas lampiran dan tanda tangan terenkripsi.
- **Biome** (^2.3.5) - Alat pemformatan (*formatter*) dan pemeriksa kode (*linter*) yang cepat.

### Frontend (`e-office-webapp-v2`)

- **Next.js** (16.0.8) - Framework React teroptimasi untuk Server-Side Rendering (SSR) & App Router.
- **React** (19.2.1) - Pustaka antarmuka grafis deklaratif berbasis komponen.
- **Tailwind CSS** (^4) - Framework styling modern berbasis utility-first.
- **Eden Treaty** (^1.4.5) - Client API type-safe yang menghubungkan langsung tipe data server Elysia ke client Next.js.
- **IndexedDB (idb-keyval)** - Penyimpanan luring (*offline storage*) untuk draf surat pemohon.

---

## 📁 Integrasi & Alur Data

### 1. Autentikasi & Autorisasi (Better Auth + Casbin)
- Autentikasi berbasis sesi (*session-based*) menggunakan secure cookies untuk menghindari kelemahan pencabutan token JWT.
- Otorisasi menggunakan Casbin dengan model **RBAC** (Role-Based Access Control) yang menentukan hak akses pengguna berdasarkan kombinasi `Subject (User/Role)`, `Object (Resource/Path)`, dan `Action (HTTP Method)`.

### 2. Integrasi SSO UNDIP
- Sistem terintegrasi dengan Single Sign-On (SSO) Universitas Diponegoro melalui endpoint API di `https://apps-fsm.undip.ac.id/sso_api`.

### 3. Object Storage (S3 / MinIO)
- Dokumen lampiran fisik, gambar pratinjau, dan berkas tanda tangan dinas diunggah langsung ke bucket `bucket-tim-2` yang terisolasi aman dari application server.

---

## 🐳 Docker Services Setup

Untuk mempermudah instalasi database dan object storage di lingkungan lokal secara cepat, gunakan Docker Compose:

```bash
cd e-office-api-v2

# Jalankan PostgreSQL, pgAdmin, dan MinIO di latar belakang
docker compose up -d

# Hentikan semua service docker
docker compose down
```

---

## 🔧 Script Lengkap Monorepo

| Perintah | Deskripsi |
|----------|-----------|
| `bun dev` | Menjalankan API & Web App secara bersamaan (paralel) |
| `bun dev:api` | Menjalankan Backend API saja (Port: 20022) |
| `bun dev:web` | Menjalankan Frontend Web saja (Port: 20021) |
| `bun build` | Melakukan kompilasi & build produksi aplikasi frontend Next.js |
| `bun start:api` | Menjalankan Backend API dalam mode produksi |
| `bun start:web` | Menjalankan Frontend Web dalam mode produksi |
| `bun db:migrate` | Menerapkan migrasi skema basis data baru via Prisma |
| `bun db:seed` | Mengisi data dummy/demo awal ke dalam database |
| `bun db:studio` | Membuka antarmuka visual penjelajah database Prisma Studio |
| `bun lint` | Memeriksa kepatuhan formatting & linting kode di seluruh workspace |

---

## 🚧 Rencana Pengembangan (Roadmap)

- [ ] Integrasi penuh Unit Testing & Integration Testing.
- [ ] Pengaturan CI/CD pipeline otomatis untuk staging dan production.
- [ ] Implementasi API Rate Limiting untuk mencegah penyalahgunaan API.
- [ ] Dukungan lokalisasi multi-bahasa (i18n).
- [ ] PWA (Progressive Web App) support untuk akses mobile luring lebih optimal.

---

## 🆘 Support

Untuk bantuan atau pertanyaan, hubungi:
- Email: support@eoffice.com
- Slack: #eoffice-dev
- Issue Tracker: GitHub Issues

---

**Last Updated**: May 2026  
**Version**: 2.0.0 (Tim 2 Configuration)  
**License**: Private - All rights reserved
