# BAB III — ARSITEKTUR SISTEM

## 3.1 Gambaran Umum Arsitektur

Sistem E-Office FSM Universitas Diponegoro dirancang menggunakan pola arsitektur **monorepo** dengan dua sub-sistem utama yang berjalan secara terpisah namun terintegrasi erat: sebuah layanan *backend* REST API dan sebuah aplikasi *frontend* web. Keduanya dikelola dalam satu repositori menggunakan **Bun Workspaces**, sehingga pembaruan tipe data dan kontrak API antara kedua sisi dapat disinkronkan tanpa mekanisme pembangkitan kode yang terpisah.

Arsitektur secara keseluruhan mengikuti pola **Client–Server** berlapis, dengan tambahan lapisan proksi terbalik (*reverse proxy*) Apache di lingkungan produksi. Gambar 3.1 menggambarkan blok komponen sistem secara menyeluruh.

```
┌───────────────────────────────────────────────────────────────┐
│                     PENGGUNA (Browser)                        │
└──────────────────────────────┬────────────────────────────────┘
                               │ HTTPS
                               ▼
┌───────────────────────────────────────────────────────────────┐
│              Apache HTTP Server (Reverse Proxy)               │
│   Strip sub-path prefix → teruskan ke Next.js / Elysia       │
└──────────┬────────────────────────────────────┬──────────────┘
           │ :20021                              │ :20022
           ▼                                     ▼
┌─────────────────────┐              ┌──────────────────────────┐
│  Frontend Web App   │              │    Backend REST API       │
│  Next.js 16         │◄────Eden ───►│    Elysia.js             │
│  (App Router)       │   Treaty     │    (Bun Runtime)         │
│  Port 20021         │              │    Port 20022             │
└─────────────────────┘              └────────────┬─────────────┘
                                                  │
                      ┌───────────────────────────┼───────────────────┐
                      ▼                           ▼                   ▼
             ┌────────────────┐       ┌─────────────────┐   ┌───────────────┐
             │  PostgreSQL 16  │       │  MinIO (S3)     │   │   SSO UNDIP   │
             │  (Database)    │       │  Object Storage  │   │  (External)   │
             └────────────────┘       └─────────────────┘   └───────────────┘
```

**Gambar 3.1** — Diagram blok komponen sistem E-Office.

---

## 3.2 Blok Komponen Sistem

### 3.2.1 Komponen Frontend — Next.js 16 Web Application

Aplikasi *frontend* dibangun menggunakan **Next.js 16** dengan fitur **App Router**. Komponen ini bertanggung jawab atas seluruh antarmuka pengguna, manajemen sesi sisi klien, serta formulir multi-langkah pengajuan surat.

**Tanggung jawab utama:**
- Merender halaman berbasis peran (*role-based routing*) untuk lima peran pengguna.
- Mengelola sesi otentikasi klien menggunakan *library* Better Auth React (`authClient`).
- Meneruskan permintaan API ke *backend* melalui rute API internal Next.js yang berfungsi sebagai *Backend-For-Frontend* (BFF).
- Menyimpan draf formulir pengajuan surat secara *offline* ke IndexedDB browser.

**Hubungan dengan komponen lain:**
Frontend berkomunikasi dengan *backend* melalui dua mekanisme:
1. **Eden Treaty** (`client` dari `src/lib/api.ts`) — klien API *type-safe* yang mengambil tipe langsung dari ekspor `App` milik Elysia, sehingga setiap perubahan *endpoint* di *backend* langsung terdeteksi oleh TypeScript di *frontend* tanpa langkah pembangkitan kode terpisah.
2. **Rute API Proxy** (`src/app/api/`) — rute Next.js yang meneruskan permintaan sensitif (seperti unggah berkas dan otentikasi) ke *backend*, sambil menyertakan *cookie* sesi secara otomatis.

### 3.2.2 Komponen Backend — Elysia.js REST API

Layanan *backend* dibangun menggunakan **Elysia.js** yang berjalan di atas **Bun Runtime**. Komponen ini merupakan inti dari seluruh logika bisnis, validasi data, otorisasi, dan akses basis data.

**Tanggung jawab utama:**
- Menyajikan *endpoint* REST API terstruktur untuk semua operasi domain.
- Menegakkan autentikasi sesi (Better Auth) dan otorisasi berbasis peran (Casbin RBAC).
- Mengorkestrasikan alur kerja persetujuan surat (*approval workflow*) tiga langkah.
- Mengelola unggahan berkas ke MinIO dan pengiriman notifikasi ke pengguna.
- Menyajikan dokumentasi API interaktif melalui Swagger UI (`/swagger`).

### 3.2.3 Komponen Database — PostgreSQL 16

Basis data relasional **PostgreSQL 16** digunakan sebagai penyimpanan data utama. Seluruh akses basis data dilakukan melalui **Prisma ORM** yang menghasilkan klien *type-safe* dari berkas skema deklaratif (`prisma/schema.prisma`).

### 3.2.4 Komponen Object Storage — MinIO (S3-Compatible)

**MinIO** digunakan sebagai penyimpanan objek (*object storage*) yang kompatibel dengan protokol AWS S3. Komponen ini menyimpan:
- Berkas lampiran fisik yang diunggah mahasiswa (KTM, transkrip, dll.).
- Gambar tanda tangan digital Manajer TU.
- Dokumen PDF final surat yang telah ditandatangani.

### 3.2.5 Komponen SSO Eksternal — SSO UNDIP

Sistem terintegrasi dengan layanan *Single Sign-On* (SSO) Universitas Diponegoro melalui API eksternal di `https://apps-fsm.undip.ac.id/sso_api`. Integrasi ini memungkinkan civitas akademika untuk masuk menggunakan kredensial UNDIP yang sudah ada.

---

## 3.3 Arsitektur Backend (e-office-api-v2)

### 3.3.1 Struktur Direktori Backend

```
e-office-api-v2/
├── src/
│   ├── index.ts                    # Titik masuk: koneksi DB & listen server
│   ├── server.ts                   # Inisialisasi Elysia, plugin global, handler
│   ├── config.ts                   # Konfigurasi environment (env-var)
│   ├── autogen.routes.ts           # Manifes tipe rute (di-generate elysia-autoload)
│   │
│   ├── routes/                     # Lapisan Routing (file-based)
│   │   ├── auth/
│   │   │   └── sso.ts              # Endpoint integrasi SSO UNDIP
│   │   ├── letter/
│   │   │   ├── ak006.ts            # Endpoint mahasiswa (pemohon)
│   │   │   ├── ak006-sa.ts         # Endpoint supervisor akademik
│   │   │   ├── ak006-mtu.ts        # Endpoint manajer TU (penandatangan)
│   │   │   ├── ak006-upa.ts        # Endpoint UPA (penomoran & arsip)
│   │   │   ├── signature.ts        # Manajemen tanda tangan MTU
│   │   │   └── superadmin.ts       # Endpoint superadmin (semua surat)
│   │   ├── master/
│   │   │   ├── user.ts             # CRUD pengguna
│   │   │   ├── role.ts             # CRUD peran
│   │   │   ├── permission.ts       # CRUD izin akses
│   │   │   ├── mahasiswa.ts        # CRUD data mahasiswa
│   │   │   ├── pegawai.ts          # CRUD data pegawai
│   │   │   ├── departemen.ts       # CRUD departemen
│   │   │   ├── prodi.ts            # CRUD program studi
│   │   │   ├── suratType.ts        # CRUD jenis surat
│   │   │   └── suratTemplate.ts    # CRUD template surat (JSON schema)
│   │   ├── public/
│   │   │   ├── sign-in.ts          # Login email/password
│   │   │   ├── register.ts         # Registrasi akun baru
│   │   │   ├── verify.ts           # Verifikasi dokumen publik via QR
│   │   │   ├── reference.ts        # Data referensi (kota, departemen)
│   │   │   ├── files.ts            # Akses berkas dari MinIO (proxy)
│   │   │   └── template.ts         # Akses template surat publik
│   │   ├── me.ts                   # Profil & data pengguna aktif
│   │   ├── dash.ts                 # Data ringkasan dashboard
│   │   ├── notification.ts         # Notifikasi in-app
│   │   └── upload.ts               # Unggah berkas ke MinIO
│   │
│   ├── middlewares/
│   │   ├── auth.ts                 # Plugin authGuardPlugin (makro permission & role)
│   │   └── context.ts              # Konteks middleware tambahan
│   │
│   ├── lib/
│   │   ├── auth.ts                 # Inisialisasi Better Auth (Prisma adapter)
│   │   └── casbin.ts               # Enforcer Casbin: sync policy & helper functions
│   │
│   ├── services/
│   │   ├── database_models/
│   │   │   ├── __basicCRUD.ts      # Pabrik abstrak CRUD (getAll/get/delete/count)
│   │   │   ├── letterInstance.service.ts   # Logika workflow surat
│   │   │   ├── letterTemplate.service.ts   # Manajemen versi template
│   │   │   ├── letterType.service.ts       # Jenis surat
│   │   │   ├── user.service.ts             # Operasi pengguna
│   │   │   ├── mahasiswa.service.ts        # Data mahasiswa
│   │   │   ├── pegawai.service.ts          # Data pegawai
│   │   │   ├── role.service.ts             # Manajemen peran
│   │   │   ├── permission.service.ts       # Manajemen izin
│   │   │   ├── departemen.service.ts       # Data departemen
│   │   │   ├── programStudi.service.ts     # Data program studi
│   │   │   └── signature.service.ts        # Manajemen tanda tangan
│   │   ├── minio.service.ts        # Abstraksi klien MinIO S3
│   │   ├── email.service.ts        # Pengiriman email (Nodemailer/SMTP)
│   │   ├── notification.service.ts # Pembuatan dan fanout notifikasi
│   │   └── locks.ts                # Mekanisme penguncian operasi (Verrou)
│   │
│   ├── db/
│   │   ├── index.ts                # Singleton PrismaClient (global untuk dev HMR)
│   │   └── seed.ts                 # Skrip seeding data demo
│   │
│   ├── constants/
│   │   └── default-templates.ts    # Template AK006 bawaan (fallback pra-versioning)
│   │
│   └── generated/
│       ├── prisma/                 # Prisma Client (di-generate `prisma generate`)
│       └── prismabox/              # TypeBox schemas (di-generate prismabox)
│
├── prisma/
│   ├── schema.prisma               # Definisi skema basis data
│   └── migrations/                 # Riwayat migrasi SQL
│
├── casbin/
│   └── model.conf                  # Definisi model RBAC Casbin
│
├── docker-compose.yml              # Services: PostgreSQL, pgAdmin, MinIO, API
├── docker-compose.dev.yml          # Override untuk environment development
├── Dockerfile                      # Kontainer produksi backend
└── biome.json                      # Konfigurasi linter dan formatter Biome
```

### 3.3.2 Lapisan Arsitektur Backend

Backend mengikuti pola arsitektur berlapis sebagai berikut:

```
┌──────────────────────────────────────────────────┐
│              LAPISAN ROUTING (routes/)            │
│   File-based autoload via elysia-autoload         │
│   Validasi skema input dengan TypeBox/Elysia t    │
└────────────────────┬─────────────────────────────┘
                     │ menggunakan
┌────────────────────▼─────────────────────────────┐
│            LAPISAN MIDDLEWARE                     │
│   authGuardPlugin → autentikasi sesi (Better Auth)│
│   Makro .permission() → cek Casbin RBAC           │
│   Makro .role()       → cek keanggotaan peran     │
└────────────────────┬─────────────────────────────┘
                     │ memanggil
┌────────────────────▼─────────────────────────────┐
│           LAPISAN SERVICE (services/)             │
│   LetterInstanceService — logika workflow         │
│   MinioService          — operasi objek           │
│   notificationService   — fanout notifikasi       │
│   emailService          — pengiriman email        │
└────────────────────┬─────────────────────────────┘
                     │ mengakses
┌────────────────────▼─────────────────────────────┐
│           LAPISAN DATA (db/ + generated/)         │
│   Prisma ORM → PrismaClient (singleton global)    │
│   PostgreSQL 16                                   │
└──────────────────────────────────────────────────┘
```

### 3.3.3 Modul dan Kelas Backend

#### a. Modul Routing (`routes/`)

Setiap berkas di dalam direktori `routes/` diekspor sebagai *default export* sebuah *instance* `Elysia`. Mekanisme `elysia-autoload` mendaftarkan seluruh berkas ini secara otomatis berdasarkan jalur direktorinya, sehingga berkas `routes/letter/ak006.ts` akan menghasilkan *endpoint* dengan awalan `/letter/ak006`. Manifes tipe seluruh rute dihasilkan ke berkas `autogen.routes.ts` yang digunakan oleh *frontend* untuk memperoleh tipe *endpoint* secara otomatis.

#### b. Kelas Abstrak `CRUD<TModel>` (`services/database_models/__basicCRUD.ts`)

Merupakan *factory function* yang mengembalikan kelas abstrak berisi metode CRUD standar. Setiap *service* model basis data mewarisi kelas ini untuk mendapatkan implementasi `getAll()`, `getMany(options)`, `get(id)`, `delete(id)`, dan `count()` tanpa duplikasi kode.

```typescript
// Contoh penggunaan
export abstract class RoleService extends CRUD(Prisma.role, { permissions: true }) {
  // RoleService mewarisi getAll, get, delete, count secara otomatis
  // dan dapat menambahkan metode khusus peran di sini
}
```

#### c. Kelas Abstrak `LetterInstanceService` (`services/database_models/letterInstance.service.ts`)

Kelas inti yang mengelola seluruh logika alur kerja surat. Metode-metode utamanya:

| Metode | Deskripsi |
|---|---|
| `getByCreator(userId, type)` | Mengambil surat milik mahasiswa |
| `getPendingForStep(step, type)` | Mengambil surat menunggu di langkah tertentu |
| `getProcessedByStep(step, type)` | Mengambil surat yang telah diproses pada suatu langkah |
| `getById(id)` | Mengambil detail surat beserta langkah persetujuan |
| `ensureTemplateConfig(letter)` | Mengisi `templateConfig` untuk surat pra-versioning |
| `backfillAllTemplateConfigs()` | Migrasi massal surat lama saat *startup* |

#### d. Plugin `authGuardPlugin` (`middlewares/auth.ts`)

*Plugin* Elysia yang menambahkan makro deklaratif ke setiap rute:

```typescript
// Contoh penggunaan dalam berkas rute
.get("/pending", handler, {
  ...requireRole("supervisor_akademik"),     // cek keanggotaan peran
})
.post("/approve", handler, {
  ...requirePermission("letter", "update"),  // cek kebijakan Casbin
})
```

Plugin ini menyelesaikan sesi pengguna terlebih dahulu, lalu memeriksa otorisasi sebelum *handler* dieksekusi.

#### e. Modul Casbin (`lib/casbin.ts`)

Mengelola *enforcer* Casbin sebagai *singleton* lazily initialized. Saat pertama kali diakses, *enforcer* memuat semua kebijakan dari tabel `RolePermission` dan `UserRole` di basis data. Model RBAC yang digunakan (`casbin/model.conf`) mendefinisikan relasi:

```
g(user_id, role_name)           → penugasan peran ke pengguna
p(role_name, resource, action)  → izin akses per peran
enforce(user_id, resource, action) → g(user, role) ∧ p(role, resource, action)
```

#### f. Kelas Abstrak `MinioService` (`services/minio.service.ts`)

Abstraksi klien MinIO S3 dengan metode statik. Berkas diunggah ke jalur bertingkat `{kategori}/{peran}/{userId}/{namaberkas}` untuk memastikan isolasi akses antar pengguna.

#### g. Modul `notificationService` (`services/notification.service.ts`)

Objek layanan dengan metode `createNotification()` dan `createNotificationForRole()`. Metode kedua secara otomatis mencari semua pengguna dengan peran tertentu dan membuat notifikasi untuk setiap pengguna, sehingga seluruh Supervisor Akademik aktif mendapat notifikasi ketika ada surat baru masuk.

---

## 3.4 Arsitektur Frontend (e-office-webapp-v2)

### 3.4.1 Struktur Direktori Frontend

```
e-office-webapp-v2/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx                  # Root layout (ThemeProvider)
│   │   ├── page.tsx                    # Halaman beranda (redirect sesuai peran)
│   │   │
│   │   ├── auth/                       # Autentikasi
│   │   │   ├── page.tsx                # Halaman login utama
│   │   │   └── login/page.tsx          # Login email/password
│   │   │
│   │   ├── sso/callback/page.tsx       # Callback setelah SSO UNDIP berhasil
│   │   ├── redirect/page.tsx           # Pengalihan pasca-login berdasarkan peran
│   │   ├── verify/[documentId]/page.tsx# Verifikasi keaslian dokumen (publik)
│   │   │
│   │   ├── surat-keterangan-aktif-kuliah/  # Alur pengajuan surat AK006
│   │   │   ├── identitas-pemohon/page.tsx  # Langkah 1: data diri mahasiswa
│   │   │   ├── lampiran/page.tsx           # Langkah 2: unggah lampiran
│   │   │   ├── review/page.tsx             # Langkah 3: pratinjau & kirim
│   │   │   └── detail-pengajuan/page.tsx   # Detail surat yang sudah diajukan
│   │   │
│   │   ├── mahasiswa/                  # Halaman khusus peran Mahasiswa
│   │   │   ├── dashboard-mahasiswa/page.tsx
│   │   │   ├── surat-saya/page.tsx     # Daftar surat milik mahasiswa
│   │   │   ├── detail-surat/page.tsx
│   │   │   ├── pratinjau/page.tsx
│   │   │   ├── revisi-surat/page.tsx   # Edit surat yang diminta revisi
│   │   │   └── profile/page.tsx
│   │   │
│   │   ├── supervisor-akademik/        # Halaman khusus peran SA
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── penerima/page.tsx       # Kotak masuk surat
│   │   │   ├── penerima/identitas-pemohon/page.tsx
│   │   │   ├── penerima/pratinjau/page.tsx
│   │   │   ├── penerima/edit/page.tsx  # Edit data surat sebelum disetujui
│   │   │   └── profile/page.tsx
│   │   │
│   │   ├── manajer-tu/                 # Halaman khusus peran MTU
│   │   │   ├── dashboard-persuratan/page.tsx
│   │   │   ├── penerima/page.tsx
│   │   │   ├── penerima/identitas-pemohon/page.tsx
│   │   │   ├── penerima/identitas-pemohon/tanda-tangan/page.tsx
│   │   │   ├── penerima/pratinjau/page.tsx
│   │   │   └── profile/page.tsx
│   │   │
│   │   ├── upa/                        # Halaman khusus peran UPA
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── penerima/page.tsx
│   │   │   ├── penerima/identitas-pemohon/page.tsx
│   │   │   ├── penerima/penomoran/page.tsx  # Pemberian nomor surat
│   │   │   ├── penerima/pratinjau/page.tsx
│   │   │   └── profile/page.tsx
│   │   │
│   │   ├── superadmin/                 # Halaman khusus peran Super Admin
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── users/page.tsx          # Manajemen pengguna
│   │   │   ├── roles/page.tsx          # Manajemen peran & izin
│   │   │   ├── letters/page.tsx        # Semua surat sistem
│   │   │   ├── letters/[id]/page.tsx
│   │   │   ├── letters/templates/page.tsx  # Manajemen template surat
│   │   │   └── settings/page.tsx
│   │   │
│   │   └── api/                        # Next.js API Routes (BFF Proxy)
│   │       ├── auth/[...slug]/route.ts # Proxy ke Better Auth
│   │       ├── auth/sign-in/route.ts
│   │       ├── letter/[...path]/route.ts
│   │       ├── me/route.ts
│   │       ├── upload/route.ts
│   │       ├── public/[...path]/route.ts
│   │       └── public/verify/[documentId]/route.ts
│   │
│   ├── components/                     # Komponen UI yang dapat digunakan ulang
│   │   ├── ui/                         # Komponen primitif (shadcn/ui + Radix UI)
│   │   ├── layouts/
│   │   │   ├── ResponsiveLayout.tsx    # Layout responsif utama
│   │   │   ├── SideBar.tsx             # Sidebar navigasi berbasis peran
│   │   │   ├── SuperadminSidebar.tsx   # Sidebar khusus superadmin
│   │   │   ├── TopBar.tsx              # Bilah atas dengan notifikasi
│   │   │   └── PageWrapper.tsx         # Pembungkus halaman standar
│   │   ├── letter/
│   │   │   ├── LetterPreviewCard.tsx   # Kartu pratinjau surat
│   │   │   ├── LetterTimeline.tsx      # Visualisasi progres persetujuan
│   │   │   ├── AttachmentList.tsx      # Daftar berkas lampiran
│   │   │   └── details/                # Sub-komponen detail surat per peran
│   │   ├── FormSurat/                  # Komponen formulir pengajuan surat
│   │   ├── templates/                  # Komponen render template surat (PDF)
│   │   ├── pages/                      # Komponen tingkat halaman yang dapat digunakan ulang
│   │   ├── CompleteProfileModal.tsx    # Modal kelengkapan profil
│   │   └── title.tsx                   # Komponen judul halaman
│   │
│   ├── context/
│   │   ├── AK006.tsx                   # Context state formulir pengajuan AK006
│   │   ├── Provider.tsx                # Pembungkus provider global
│   │   └── ThemeProvider.tsx           # Penyedia tema terang/gelap
│   │
│   ├── hooks/
│   │   ├── use-file-upload.ts          # Hook unggah berkas ke MinIO
│   │   ├── use-ak006-template.ts       # Hook pengambilan & parsing template AK006
│   │   └── use-app-router.ts           # Hook router dengan withBasePath bawaan
│   │
│   └── lib/
│       ├── api.ts                      # Klien Eden Treaty + helper fetch + tipe respons
│       ├── auth-client.ts              # Better Auth React client
│       ├── navigation.ts               # withBasePath() helper untuk sub-path Apache
│       ├── indexedDB.ts                # Abstraksi IndexedDB (EOfficeDB v2)
│       ├── helpers.ts                  # Utilitas (throttle, debounce)
│       ├── utils.ts                    # Utilitas umum (cn/clsx)
│       └── indonesianCities.ts         # Data kota Indonesia untuk autocomplete
│
├── public/                             # Aset statis
└── next.config.ts                      # Konfigurasi Next.js
```

### 3.4.2 Modul dan Kelas Frontend

#### a. Modul Klien API (`lib/api.ts`)

Modul ini merupakan jembatan utama antara *frontend* dan *backend*. Menggunakan **Eden Treaty** untuk menghasilkan klien API yang tipenya disinkronkan langsung dari tipe `App` ekspor Elysia:

```typescript
import { treaty } from '@elysiajs/eden';
import type { App } from '@backend/autogen.routes';

export const client = treaty<App>(backendOrigin);
// Contoh: client.letter.ak006.my.get() sudah bertipe sesuai respons backend
```

Modul ini juga mengekspor *helper* `fetch`-berbasis (`letterApi`, `userApi`, `referenceApi`, dll.) untuk operasi yang membutuhkan penanganan header khusus.

#### b. Context `AK006` (`context/AK006.tsx`)

*React Context* yang menjadi pengelola *state* pusat untuk alur formulir pengajuan surat multi-langkah. Menyimpan seluruh data `ProfileData` (identitas pemohon, lampiran, data orang tua) dan menyediakan metode `saveAndNext()`, `setRevisionMode()`, serta `resetReachedStep()` untuk navigasi antar langkah.

#### c. Komponen `AppSidebar` (`components/layouts/SideBar.tsx`)

Komponen navigasi lateral yang mengkonfigurasi tautan menu secara dinamis berdasarkan properti `role` yang diterima. Mendukung empat konfigurasi peran: `mahasiswa`, `supervisor-akademik`, `manajer-tu`, dan `upa`, masing-masing dengan jalur *dashboard* dan *profil* yang berbeda.

#### d. Komponen `LetterTimeline` (`components/letter/LetterTimeline.tsx`)

Komponen visualisasi progres persetujuan surat yang menampilkan tiga langkah (*step*) alur kerja beserta status masing-masing langkah (`PENDING`, `APPROVED`, `REJECTED`, `REVISION`).

#### e. Modul IndexedDB (`lib/indexedDB.ts`)

Abstraksi penyimpanan *offline* menggunakan IndexedDB versi 2 dengan dua *object store*:
- `attachments` — menyimpan objek `File` sebelum diunggah.
- `uploaded_attachments` — menyimpan URL berkas setelah berhasil diunggah ke MinIO.

#### f. Fungsi `withBasePath()` (`lib/navigation.ts`)

Fungsi utilitas penting untuk lingkungan produksi di balik proksi Apache. Seluruh navigasi manual wajib menggunakan fungsi ini agar awalan sub-jalur (`NEXT_PUBLIC_BASE_PATH`) ditambahkan secara konsisten:

```typescript
// Benar:
router.push(withBasePath('/mahasiswa/dashboard-mahasiswa'));
// Salah (tidak berfungsi di produksi):
router.push('/mahasiswa/dashboard-mahasiswa');
```

---

## 3.5 Struktur Menu Berdasarkan Peran

Sistem E-Office menerapkan kontrol akses berbasis peran (*RBAC*) yang tercermin langsung pada struktur menu dan rute halaman. Tabel 3.1 merangkum menu yang tersedia untuk setiap peran.

**Tabel 3.1** — Struktur menu per peran pengguna.

| Peran | Menu Utama | Sub-Menu / Fitur |
|---|---|---|
| **Mahasiswa** | Dashboard | Ringkasan status surat |
| | Surat Saya | Daftar semua pengajuan surat |
| | Ajukan Surat | Formulir multi-langkah: Identitas Pemohon → Lampiran → Pratinjau & Kirim |
| | Profil | Data diri & kelengkapan profil |
| **Supervisor Akademik** | Dashboard | Jumlah surat menunggu verifikasi |
| | Kotak Masuk (Penerima) | Daftar surat pending SA: detail, pratinjau, setujui/revisi/tolak |
| | Profil | Data diri |
| **Manajer TU** | Dashboard | Jumlah surat menunggu tanda tangan |
| | Kotak Masuk (Penerima) | Daftar surat pending MTU: detail, pratinjau, unggah tanda tangan, tanda tangani |
| | Profil | Manajemen tanda tangan digital |
| **UPA** | Dashboard | Jumlah surat menunggu penomoran |
| | Kotak Masuk (Penerima) | Daftar surat pending UPA: detail, beri nomor surat, arsip PDF |
| | Profil | Data diri |
| **Super Admin** | Dashboard | Statistik sistem menyeluruh |
| | Manajemen Pengguna | CRUD pengguna: mahasiswa & pegawai |
| | Manajemen Peran | CRUD peran & penetapan izin akses (permission) |
| | Semua Surat | Pantauan seluruh surat di sistem |
| | Template Surat | Manajemen versi template AK006 (JSON schema) |
| | Pengaturan | Konfigurasi sistem |

---

## 3.6 Skema Basis Data

Basis data terdiri dari 16 tabel utama yang dikelompokkan ke dalam tiga domain:

### Domain Autentikasi & Otorisasi
- `user` — data pengguna (nama, email, status anonim)
- `session` — sesi autentikasi aktif (Better Auth)
- `account` — akun penyedia OAuth/SSO terhubung
- `verification` — token verifikasi email
- `role` — definisi peran (mahasiswa, supervisor_akademik, manajer_tu, upa, superadmin)
- `permission` — definisi izin (`resource` × `action`)
- `user_role` — relasi pengguna–peran (Many-to-Many)
- `role_permission` — relasi peran–izin (Many-to-Many)
- `jwks` — kunci JSON Web Key Set (Better Auth)

### Domain Profil Pengguna
- `mahasiswa` — profil mahasiswa (NIM, tahun masuk, alamat, orang tua, relasi ke departemen & prodi)
- `pegawai` — profil pegawai (NIP, jabatan, relasi ke departemen & prodi)
- `departemen` — data departemen/jurusan
- `program_studi` — data program studi

### Domain Persuratan
- `letter_type` — jenis surat (contoh: AK006)
- `letter_template` — versi template surat dalam format JSON (`schemaDefinition`, `formFields`)
- `letter_instance` — instansi surat (status, nilai formulir, nomor surat, URL dokumen final)
- `letter_approval_step` — langkah persetujuan (1=SA, 2=MTU, 3=UPA) beserta status & komentar
- `attachment` — berkas lampiran surat
- `signature` — gambar tanda tangan digital MTU
- `notification` — notifikasi in-app per pengguna

### Alur Kerja Persetujuan Surat

```
Mahasiswa mengajukan surat
        │
        ▼
LetterInstance dibuat (status: PENDING, currentStep: 1)
        │
        ▼
[Langkah 1 — Supervisor Akademik]
  PENDING → APPROVED  → currentStep = 2
  PENDING → REJECTED  → status = REJECTED (selesai)
  PENDING → REVISION  → mahasiswa merevisi, kembali ke Langkah 1
        │ APPROVED
        ▼
[Langkah 2 — Manajer TU]
  PENDING → APPROVED + unggah tanda tangan → currentStep = 3
  PENDING → REJECTED  → status = REJECTED (selesai)
  PENDING → REVISION  → mahasiswa merevisi, kembali ke Langkah 1
        │ APPROVED
        ▼
[Langkah 3 — UPA]
  PENDING → APPROVED + beri nomor surat → status = COMPLETED
  PENDING → REJECTED  → status = REJECTED (selesai)
```

---

## 3.7 Konfigurasi Deployment ke Server

### 3.7.1 Arsitektur Deployment Produksi

```
                  Internet
                     │
                     ▼
        ┌────────────────────────┐
        │   Apache HTTP Server   │
        │   (Port 80 / 443)      │
        │                        │
        │  ProxyPass /api/       │──────► Elysia API :20022
        │  ProxyPass /           │──────► Next.js   :20021
        └────────────────────────┘
```

Apache dikonfigurasi sebagai *reverse proxy* yang meneruskan:
- Seluruh permintaan ke jalur `/api/` diteruskan ke *backend* Elysia (port 20022).
- Seluruh permintaan lainnya diteruskan ke *frontend* Next.js (port 20021).

**Penting:** Apache melakukan *strip* awalan sub-jalur sebelum meneruskan ke Next.js. Oleh karena itu, `basePath` di `next.config.ts` **tidak** digunakan. Sebagai gantinya, variabel lingkungan `NEXT_PUBLIC_BASE_PATH` digunakan di sisi aplikasi.

### 3.7.2 Layanan Docker (Infrastruktur Pendukung)

Infrastruktur basis data dan *object storage* dijalankan sebagai kontainer Docker melalui `docker-compose.yml` di direktori `e-office-api-v2/`:

```yaml
# Ringkasan konfigurasi docker-compose.yml
services:
  postgres:       # PostgreSQL 16, port 5432, volume postgres_data
  pgadmin:        # pgAdmin 4, port 5050 (GUI manajemen DB)
  minio:          # MinIO, port 9000 (API S3), port 9001 (Console)
  bot:            # Kontainer produksi backend (dibangun dari Dockerfile)
```

| Layanan | Image | Port | Kredensial Default |
|---|---|---|---|
| PostgreSQL | `postgres:16-alpine` | 5432 | Lihat env `DATABASE_URL` |
| pgAdmin | `dpage/pgadmin4:latest` | 5050 | `admin@example.com` / `admin` |
| MinIO API | `minio/minio:latest` | 9000 | `minioadmin` / `minioadmin` |
| MinIO Console | `minio/minio:latest` | 9001 | `minioadmin` / `minioadmin` |

### 3.7.3 Konfigurasi Environment Produksi

**Backend (`e-office-api-v2/.env`):**

| Variabel | Deskripsi |
|---|---|
| `DATABASE_URL` | *Connection string* PostgreSQL |
| `BETTER_AUTH_SECRET` | Kunci rahasia HMAC untuk penandatanganan *cookie* sesi |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Daftar *origin* yang diizinkan (dipisah koma) |
| `PORT` | Port server API (default: 20022) |
| `FRONTEND_URL` | URL *frontend* untuk tautan SSO *redirect* |
| `SSO_HOST` | Base URL layanan SSO UNDIP |
| `S3_ENDPOINT` | URL endpoint MinIO (contoh: `http://localhost:9000`) |
| `S3_ACCESS_KEY` | Kunci akses MinIO |
| `S3_SECRET_KEY` | Kunci rahasia MinIO |
| `S3_BUCKET` | Nama *bucket* yang digunakan (`bucket-tim-2`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Konfigurasi SMTP email |

**Frontend (`e-office-webapp-v2/.env`):**

| Variabel | Deskripsi |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL *origin* backend (tanpa *trailing slash*) |
| `NEXT_PUBLIC_BASE_PATH` | Awalan sub-jalur untuk proksi Apache (contoh: `/persuratan-penyataan-masih-kuliah`) |

### 3.7.4 Perintah Deployment

```bash
# 1. Nyalakan infrastruktur pendukung (DB & Storage)
cd e-office-api-v2
docker compose up -d

# 2. Instalasi dependensi dari root monorepo
bun install

# 3. Jalankan migrasi skema & seeding data awal
bun db:migrate
bun db:seed

# 4. Build frontend untuk produksi
bun build

# 5. Jalankan kedua layanan dalam mode produksi
bun start:api   # Elysia API di port 20022
bun start:web   # Next.js di port 20021
```

### 3.7.5 Port Layanan

| Layanan | URL Lokal | Deskripsi |
|---|---|---|
| Frontend Web | `http://localhost:20021` | Aplikasi klien utama |
| Backend API | `http://localhost:20022` | REST API endpoint |
| Swagger Docs | `http://localhost:20022/swagger` | Dokumentasi API interaktif |
| Prisma Studio | `http://localhost:5555` | GUI penjelajah basis data |
| pgAdmin | `http://localhost:5050` | GUI manajemen PostgreSQL |
| MinIO Console | `http://localhost:9001` | GUI *object storage* |
