# Implementasi Database

Bagian ini merupakan hasil dari perancangan data berupa tabel dalam basis data.
Berikut adalah hasil implementasi tabel dari rancangan basis data yang digunakan
dalam melakukan pengembangan Sistem E-Office di FSM UNDIP.

---

## 1. Tabel : user

- **Primary Key** : id
- **Foreign Key** : –
- **Jumlah Field** : 9

Informasi detail terkait tabel *user* dapat dilihat pada Tabel 1.

**Tabel 1. Implementasi Database User**

| Nama Field     | Deskripsi                                   | Tipe Data | Null |
|----------------|---------------------------------------------|-----------|------|
| id             | Identitas unik pengguna (CUID)              | text      | No   |
| name           | Nama lengkap pengguna                       | text      | No   |
| email          | Alamat email pengguna (unik)                | text      | No   |
| emailVerified  | Status verifikasi email                     | boolean   | No   |
| image          | URL foto profil pengguna                    | text      | Yes  |
| isAnonymous    | Penanda akun anonim (SSO login)             | boolean   | Yes  |
| createdAt      | Waktu pembuatan data                        | timestamp | Yes  |
| updatedAt      | Waktu terakhir data diperbarui              | timestamp | Yes  |
| deletedAt      | Waktu penghapusan data (soft delete)        | timestamp | Yes  |

---

## 2. Tabel : session

- **Primary Key** : id
- **Foreign Key** : userId
- **Jumlah Field** : 8

Informasi detail terkait tabel *session* dapat dilihat pada Tabel 2.

**Tabel 2. Implementasi Database Session**

| Nama Field | Deskripsi                                      | Tipe Data | Null |
|------------|------------------------------------------------|-----------|------|
| id         | Identitas unik sesi                            | text      | No   |
| expiresAt  | Waktu kedaluwarsa sesi                         | timestamp | No   |
| token      | Token sesi (unik)                              | text      | No   |
| createdAt  | Waktu pembuatan sesi                           | timestamp | No   |
| updatedAt  | Waktu terakhir sesi diperbarui                 | timestamp | No   |
| ipAddress  | Alamat IP perangkat pengguna                   | text      | Yes  |
| userAgent  | Informasi browser/perangkat pengguna           | text      | Yes  |
| userId     | Referensi ID pengguna pemilik sesi             | text      | No   |

---

## 3. Tabel : account

- **Primary Key** : id
- **Foreign Key** : userId
- **Jumlah Field** : 13

Informasi detail terkait tabel *account* dapat dilihat pada Tabel 3.

**Tabel 3. Implementasi Database Account**

| Nama Field             | Deskripsi                                   | Tipe Data | Null |
|------------------------|---------------------------------------------|-----------|------|
| id                     | Identitas unik akun                         | text      | No   |
| accountId              | ID akun dari provider                       | text      | No   |
| providerId             | ID provider autentikasi                     | text      | No   |
| userId                 | Referensi ID pengguna                       | text      | No   |
| accessToken            | Token akses dari provider                   | text      | Yes  |
| refreshToken           | Token refresh dari provider                 | text      | Yes  |
| idToken                | ID token dari provider                      | text      | Yes  |
| accessTokenExpiresAt   | Waktu kedaluwarsa access token              | timestamp | Yes  |
| refreshTokenExpiresAt  | Waktu kedaluwarsa refresh token             | timestamp | Yes  |
| scope                  | Cakupan izin dari provider                  | text      | Yes  |
| password               | Password yang telah di-hash                 | text      | Yes  |
| createdAt              | Waktu pembuatan akun                        | timestamp | No   |
| updatedAt              | Waktu terakhir akun diperbarui              | timestamp | No   |

---

## 4. Tabel : verification

- **Primary Key** : id
- **Foreign Key** : –
- **Jumlah Field** : 6

Informasi detail terkait tabel *verification* dapat dilihat pada Tabel 4.

**Tabel 4. Implementasi Database Verification**

| Nama Field | Deskripsi                                      | Tipe Data | Null |
|------------|------------------------------------------------|-----------|------|
| id         | Identitas unik data verifikasi                 | text      | No   |
| identifier | Pengenal target verifikasi (email/no. hp)      | text      | No   |
| value      | Nilai token verifikasi                         | text      | No   |
| expiresAt  | Waktu kedaluwarsa verifikasi                   | timestamp | No   |
| createdAt  | Waktu pembuatan data verifikasi                | timestamp | No   |
| updatedAt  | Waktu terakhir data verifikasi diperbarui      | timestamp | No   |

---

## 5. Tabel : jwks

- **Primary Key** : id
- **Foreign Key** : –
- **Jumlah Field** : 5

Informasi detail terkait tabel *jwks* dapat dilihat pada Tabel 5.

**Tabel 5. Implementasi Database Jwks**

| Nama Field | Deskripsi                                      | Tipe Data | Null |
|------------|------------------------------------------------|-----------|------|
| id         | Identitas unik JWKS                            | text      | No   |
| publicKey  | Kunci publik untuk verifikasi JWT              | text      | No   |
| privateKey | Kunci privat untuk penandatanganan JWT         | text      | No   |
| createdAt  | Waktu pembuatan kunci                          | timestamp | No   |
| expiresAt  | Waktu kedaluwarsa kunci                        | timestamp | Yes  |

---

## 6. Tabel : role

- **Primary Key** : id
- **Foreign Key** : –
- **Jumlah Field** : 2

Informasi detail terkait tabel *role* dapat dilihat pada Tabel 6.

**Tabel 6. Implementasi Database Role**

| Nama Field | Deskripsi                                      | Tipe Data | Null |
|------------|------------------------------------------------|-----------|------|
| id         | Identitas unik peran (CUID)                    | text      | No   |
| name       | Nama peran (unik)                              | text      | No   |

---

## 7. Tabel : permission

- **Primary Key** : id
- **Foreign Key** : –
- **Jumlah Field** : 3

Informasi detail terkait tabel *permission* dapat dilihat pada Tabel 7.

**Tabel 7. Implementasi Database Permission**

| Nama Field | Deskripsi                                      | Tipe Data | Null |
|------------|------------------------------------------------|-----------|------|
| id         | Identitas unik izin (CUID)                     | text      | No   |
| resource   | Nama sumber daya yang diatur izinnya           | text      | No   |
| action     | Jenis aksi yang diizinkan (read/write/dll)     | text      | No   |

---

## 8. Tabel : user_role

- **Primary Key** : id
- **Foreign Key** : userId, roleId
- **Jumlah Field** : 3

Informasi detail terkait tabel *user_role* dapat dilihat pada Tabel 8.

**Tabel 8. Implementasi Database User Role**

| Nama Field | Deskripsi                                      | Tipe Data | Null |
|------------|------------------------------------------------|-----------|------|
| id         | Identitas unik relasi pengguna-peran (CUID)    | text      | No   |
| userId     | Referensi ID pengguna                          | text      | No   |
| roleId     | Referensi ID peran                             | text      | No   |

---

## 9. Tabel : role_permission

- **Primary Key** : id
- **Foreign Key** : roleId, permissionId
- **Jumlah Field** : 3

Informasi detail terkait tabel *role_permission* dapat dilihat pada Tabel 9.

**Tabel 9. Implementasi Database Role Permission**

| Nama Field   | Deskripsi                                    | Tipe Data | Null |
|--------------|----------------------------------------------|-----------|------|
| id           | Identitas unik relasi peran-izin (CUID)      | text      | No   |
| roleId       | Referensi ID peran                           | text      | No   |
| permissionId | Referensi ID izin                            | text      | No   |

---

## 10. Tabel : mahasiswa

- **Primary Key** : id
- **Foreign Key** : userId, departemenId, programStudiId
- **Jumlah Field** : 10

Informasi detail terkait tabel *mahasiswa* dapat dilihat pada Tabel 10.

**Tabel 10. Implementasi Database Mahasiswa**

| Nama Field    | Deskripsi                                       | Tipe Data | Null |
|---------------|-------------------------------------------------|-----------|------|
| id            | Identitas unik data mahasiswa (CUID)            | text      | No   |
| nim           | Nomor Induk Mahasiswa (unik)                    | text      | No   |
| tahunMasuk    | Tahun angkatan masuk mahasiswa                  | text      | No   |
| noHp          | Nomor handphone mahasiswa                       | text      | No   |
| alamat        | Alamat tempat tinggal mahasiswa                 | text      | Yes  |
| tempatLahir   | Kota/kabupaten tempat lahir mahasiswa           | text      | Yes  |
| tanggalLahir  | Tanggal lahir mahasiswa                         | timestamp | Yes  |
| userId        | Referensi ID pengguna (unik)                    | text      | No   |
| departemenId  | Referensi ID departemen mahasiswa               | text      | No   |
| programStudiId| Referensi ID program studi mahasiswa            | text      | No   |

---

## 11. Tabel : pegawai

- **Primary Key** : id
- **Foreign Key** : userId, departemenId, programStudiId
- **Jumlah Field** : 10

Informasi detail terkait tabel *pegawai* dapat dilihat pada Tabel 11.

**Tabel 11. Implementasi Database Pegawai**

| Nama Field    | Deskripsi                                       | Tipe Data | Null |
|---------------|-------------------------------------------------|-----------|------|
| id            | Identitas unik data pegawai (CUID)              | text      | No   |
| nip           | Nomor Induk Pegawai                             | text      | No   |
| jabatan       | Jabatan/posisi pegawai                          | text      | No   |
| noHp          | Nomor handphone pegawai                         | text      | Yes  |
| userId        | Referensi ID pengguna (unik)                    | text      | No   |
| departemenId  | Referensi ID departemen pegawai                 | text      | Yes  |
| programStudiId| Referensi ID program studi pegawai              | text      | Yes  |
| createdAt     | Waktu pembuatan data                            | timestamp | Yes  |
| updatedAt     | Waktu terakhir data diperbarui                  | timestamp | Yes  |
| deletedAt     | Waktu penghapusan data (soft delete)            | timestamp | Yes  |

---

## 12. Tabel : departemen

- **Primary Key** : id
- **Foreign Key** : –
- **Jumlah Field** : 6

Informasi detail terkait tabel *departemen* dapat dilihat pada Tabel 12.

**Tabel 12. Implementasi Database Departemen**

| Nama Field | Deskripsi                                      | Tipe Data | Null |
|------------|------------------------------------------------|-----------|------|
| id         | Identitas unik departemen (CUID)               | text      | No   |
| name       | Nama departemen                                | text      | No   |
| code       | Kode departemen (unik)                         | text      | No   |
| createdAt  | Waktu pembuatan data                           | timestamp | Yes  |
| updatedAt  | Waktu terakhir data diperbarui                 | timestamp | Yes  |
| deletedAt  | Waktu penghapusan data (soft delete)           | timestamp | Yes  |

---

## 13. Tabel : program_studi

- **Primary Key** : id
- **Foreign Key** : departemenId
- **Jumlah Field** : 7

Informasi detail terkait tabel *program_studi* dapat dilihat pada Tabel 13.

**Tabel 13. Implementasi Database Program Studi**

| Nama Field  | Deskripsi                                     | Tipe Data | Null |
|-------------|-----------------------------------------------|-----------|------|
| id          | Identitas unik program studi (CUID)           | text      | No   |
| name        | Nama program studi                            | text      | No   |
| code        | Kode program studi (unik)                     | text      | No   |
| departemenId| Referensi ID departemen                       | text      | No   |
| createdAt   | Waktu pembuatan data                          | timestamp | Yes  |
| updatedAt   | Waktu terakhir data diperbarui                | timestamp | Yes  |
| deletedAt   | Waktu penghapusan data (soft delete)          | timestamp | Yes  |

---

## 14. Tabel : letter_type

- **Primary Key** : id
- **Foreign Key** : –
- **Jumlah Field** : 6

Informasi detail terkait tabel *letter_type* dapat dilihat pada Tabel 14.

**Tabel 14. Implementasi Database Letter Type**

| Nama Field  | Deskripsi                                     | Tipe Data | Null |
|-------------|-----------------------------------------------|-----------|------|
| id          | Identitas unik jenis surat (CUID)             | text      | No   |
| name        | Nama jenis surat                              | text      | No   |
| description | Keterangan jenis surat                        | text      | Yes  |
| createdAt   | Waktu pembuatan data                          | timestamp | Yes  |
| updatedAt   | Waktu terakhir data diperbarui                | timestamp | Yes  |
| deletedAt   | Waktu penghapusan data (soft delete)          | timestamp | Yes  |

---

## 15. Tabel : letter_template

- **Primary Key** : id
- **Foreign Key** : letter_type_id
- **Jumlah Field** : 7

Informasi detail terkait tabel *letter_template* dapat dilihat pada Tabel 15.

**Tabel 15. Implementasi Database Letter Template**

| Nama Field        | Deskripsi                                          | Tipe Data | Null |
|-------------------|----------------------------------------------------|-----------|------|
| id                | Identitas unik template surat (CUID)               | text      | No   |
| version_name      | Nama versi template                                | text      | No   |
| schema_defintion  | Definisi skema dokumen dalam format JSON           | jsonb     | No   |
| form_fields       | Konfigurasi field formulir pengajuan (JSON)        | jsonb     | No   |
| is_active         | Status keaktifan template                          | boolean   | No   |
| letter_type_id    | Referensi ID jenis surat                           | text      | No   |
| created_at        | Waktu pembuatan template                           | timestamp | No   |

---

## 16. Tabel : letter_instance

- **Primary Key** : id
- **Foreign Key** : archived_by_id, letterTypeId, createdById
- **Jumlah Field** : 16

Informasi detail terkait tabel *letter_instance* dapat dilihat pada Tabel 16.

**Tabel 16. Implementasi Database Letter Instance**

| Nama Field          | Deskripsi                                               | Tipe Data    | Null |
|---------------------|---------------------------------------------------------|--------------|------|
| id                  | Identitas unik instansi surat (CUID)                    | text         | No   |
| schema              | Skema dokumen surat dalam format JSON                   | jsonb        | No   |
| values              | Nilai isian formulir pengajuan surat (JSON)             | jsonb        | No   |
| template_config     | Snapshot konfigurasi template saat pengajuan (JSON)     | jsonb        | Yes  |
| status              | Status surat (PENDING/IN_PROGRESS/COMPLETED/REJECTED)   | letter_status| No   |
| currentStep         | Langkah persetujuan saat ini (1–3)                      | integer      | No   |
| temporary_agenda    | Nomor agenda sementara saat pengajuan                   | text         | Yes  |
| letter_number       | Nomor surat resmi (diisi UPA)                           | text         | Yes  |
| signature_url       | URL gambar tanda tangan MTU                             | text         | Yes  |
| final_document_url  | URL dokumen akhir yang telah ditandatangani             | text         | Yes  |
| archived_at         | Waktu pengarsipan surat oleh UPA                        | timestamp    | Yes  |
| archived_by_id      | Referensi ID pengguna yang mengarsipkan                 | text         | Yes  |
| letterTypeId        | Referensi ID jenis surat                                | text         | No   |
| createdById         | Referensi ID mahasiswa pengaju surat                    | text         | No   |
| createdAt           | Waktu pengajuan surat                                   | timestamp    | No   |
| updatedAt           | Waktu terakhir data diperbarui                          | timestamp    | Yes  |

---

## 17. Tabel : letter_approval_step

- **Primary Key** : id
- **Foreign Key** : letterInstanceId, actor_id
- **Jumlah Field** : 9

Informasi detail terkait tabel *letter_approval_step* dapat dilihat pada Tabel 17.

**Tabel 17. Implementasi Database Letter Approval Step**

| Nama Field      | Deskripsi                                               | Tipe Data           | Null |
|-----------------|---------------------------------------------------------|---------------------|------|
| id              | Identitas unik langkah persetujuan (CUID)               | text                | No   |
| letterInstanceId| Referensi ID instansi surat                             | text                | No   |
| step_number     | Nomor urut langkah (1=SA, 2=MTU, 3=UPA)                | integer             | No   |
| status          | Status langkah (PENDING/APPROVED/REJECTED/REVISION)     | approval_step_status| No   |
| comments        | Catatan/komentar dari pelaksana langkah                 | text                | Yes  |
| actor_id        | Referensi ID pengguna pelaksana langkah                 | text                | Yes  |
| actor_role      | Nama peran pelaksana langkah                            | text                | Yes  |
| createdAt       | Waktu pembuatan langkah                                 | timestamp           | No   |
| updatedAt       | Waktu terakhir langkah diperbarui                       | timestamp           | Yes  |

---

## 18. Tabel : attachment

- **Primary Key** : id
- **Foreign Key** : letterInstanceId
- **Jumlah Field** : 10

Informasi detail terkait tabel *attachment* dapat dilihat pada Tabel 18.

**Tabel 18. Implementasi Database Attachment**

| Nama Field      | Deskripsi                                          | Tipe Data | Null |
|-----------------|----------------------------------------------------|-----------|------|
| id              | Identitas unik lampiran (CUID)                     | text      | No   |
| filename        | Nama file yang tersimpan di server                 | text      | No   |
| originalName    | Nama file asli saat diunggah                       | text      | No   |
| mimeType        | Tipe MIME file (contoh: application/pdf)           | text      | Yes  |
| size            | Ukuran file dalam satuan byte                      | integer   | Yes  |
| url             | URL akses file di MinIO                            | text      | No   |
| letterInstanceId| Referensi ID instansi surat terkait                | text      | Yes  |
| createdAt       | Waktu pengunggahan lampiran                        | timestamp | Yes  |
| updatedAt       | Waktu terakhir data diperbarui                     | timestamp | Yes  |
| deletedAt       | Waktu penghapusan data (soft delete)               | timestamp | Yes  |

---

## 19. Tabel : signature

- **Primary Key** : id
- **Foreign Key** : userId
- **Jumlah Field** : 5

Informasi detail terkait tabel *signature* dapat dilihat pada Tabel 19.

**Tabel 19. Implementasi Database Signature**

| Nama Field | Deskripsi                                           | Tipe Data | Null |
|------------|-----------------------------------------------------|-----------|------|
| id         | Identitas unik tanda tangan (CUID)                  | text      | No   |
| userId     | Referensi ID pengguna pemilik tanda tangan          | text      | No   |
| image_url  | URL gambar tanda tangan di MinIO                    | text      | No   |
| is_default | Penanda tanda tangan utama/aktif                    | boolean   | No   |
| createdAt  | Waktu pengunggahan tanda tangan                     | timestamp | No   |

---

## 20. Tabel : notification

- **Primary Key** : id
- **Foreign Key** : user_id, letter_instance_id
- **Jumlah Field** : 9

Informasi detail terkait tabel *notification* dapat dilihat pada Tabel 20.

**Tabel 20. Implementasi Database Notification**

| Nama Field        | Deskripsi                                               | Tipe Data        | Null |
|-------------------|---------------------------------------------------------|------------------|------|
| id                | Identitas unik notifikasi (CUID)                        | text             | No   |
| user_id           | Referensi ID pengguna penerima notifikasi               | text             | No   |
| type              | Jenis notifikasi (LETTER_SUBMITTED/NEEDS_VERIFICATION/dll) | notification_type| No   |
| title             | Judul notifikasi                                        | text             | No   |
| message           | Isi pesan notifikasi                                    | text             | No   |
| letter_instance_id| Referensi ID instansi surat terkait                     | text             | Yes  |
| is_read           | Status notifikasi sudah dibaca atau belum               | boolean          | No   |
| metadata          | Data tambahan dalam format JSON                         | jsonb            | Yes  |
| created_at        | Waktu pembuatan notifikasi                              | timestamp        | No   |
