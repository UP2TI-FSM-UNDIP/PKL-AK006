# Sequence Diagram — E-Office Monorepo (FSM UNDIP)

> Format: **Mermaid** — render di GitHub, VS Code (Mermaid Preview), Obsidian, Notion, dll.

---

## Daftar Diagram

1. [Login — Email & Password](#1-login--email--password)
2. [Login — SSO UNDIP](#2-login--sso-undip)
3. [Auth Guard (per-request)](#3-auth-guard--per-request)
4. [AK006 Happy Path — Pengajuan s.d. Selesai](#4-ak006-happy-path--pengajuan-sd-selesai)
5. [Revisi oleh SA → Mahasiswa Resubmit](#5-revisi-oleh-sa--mahasiswa-resubmit)
6. [MTU Revision → ke Mahasiswa atau SA](#6-mtu-revision--ke-mahasiswa-atau-sa)
7. [Penolakan (Reject) oleh SA / MTU / UPA](#7-penolakan-reject-oleh-sa--mtu--upa)
8. [Upload File ke MinIO](#8-upload-file-ke-minio)
9. [Notifikasi Fanout ke Role](#9-notifikasi-fanout-ke-role)

---

## 1. Login — Email & Password

```mermaid
sequenceDiagram
    autonumber
    actor Pengguna as Pengguna (Browser)
    participant FE as Next.js Frontend
    participant BFF as Next.js API (BFF)
    participant BE as Elysia API
    participant BA as BetterAuth
    participant DB as PostgreSQL

    Pengguna->>FE: Isi form login (email, password)
    FE->>BFF: POST /api/auth/sign-in/email
    BFF->>BE: POST /api/auth/sign-in/email (proxy)
    BE->>BA: auth.api.signInEmail({ email, password })
    BA->>DB: SELECT user WHERE email = ?
    DB-->>BA: User row
    BA->>BA: bcrypt.compare(password, hash)
    alt Password salah
        BA-->>BE: throw 401
        BE-->>BFF: 401 Unauthorized
        BFF-->>FE: 401
        FE-->>Pengguna: Tampilkan pesan "Kredensial salah"
    else Password benar
        BA->>DB: INSERT session (token, userId, expiresAt)
        DB-->>BA: Session row
        BA-->>BE: { user, session, token }
        BE-->>BFF: 200 + Set-Cookie better-auth.session=[signed-token] HttpOnly
        BFF-->>FE: 200 OK + cookie
        FE-->>Pengguna: Redirect ke /dashboard sesuai role
    end
```

---

## 2. Login — SSO UNDIP

```mermaid
sequenceDiagram
    autonumber
    actor Mhs as Mahasiswa
    participant FE as Next.js Frontend
    participant BFF as Next.js API (BFF)
    participant SSOENG as SSO Engine UNDIP
    participant BE as Elysia API
    participant DB as PostgreSQL
    participant Casbin as CasbinService

    Mhs->>FE: Klik "Login dengan SSO UNDIP"
    FE->>SSOENG: Redirect ke halaman SSO UNDIP
    Mhs->>SSOENG: Isi username & password UNDIP
    SSOENG->>SSOENG: Validasi kredensial
    SSOENG->>BE: GET /auth/sso + Authorization Bearer [sso_token]

    BE->>SSOENG: GET /users/me (validasi token)
    SSOENG-->>BE: id, name, username, role

    BE->>DB: SELECT User WHERE email = username
    alt User belum ada
        BE->>DB: INSERT User (name, email, emailVerified=true)
        DB-->>BE: User baru
    else User sudah ada
        DB-->>BE: User existing
    end

    BE->>DB: SELECT Role WHERE name = ssoRoleMap[role]
    alt Role belum dimiliki user
        BE->>DB: INSERT UserRole (userId, roleId)
        BE->>Casbin: assignRoleToUser(userId, roleName)
        Casbin-->>BE: Policy synced in-memory
    end

    BE->>DB: INSERT Session (token=randomHex, userId, expiresAt=+7hari)
    DB-->>BE: Session row

    BE-->>SSOENG: callback_url = /redirect?token=[rawToken]
    SSOENG->>BE: GET /auth/sso/redirect?token=[rawToken]
    BE-->>Mhs: HTTP 302 ke FRONTEND_URL/sso/callback?token=[rawToken]

    Mhs->>FE: Browser follow redirect ke /sso/callback
    FE->>BFF: POST /api/auth/sso/session dengan token
    BFF->>BE: POST /api/auth/set-session (HMAC-sign token)
    BE->>DB: SELECT Session WHERE token = rawToken
    DB-->>BE: Session valid
    BE-->>BFF: 200 + Set-Cookie better-auth.session=[signed] HttpOnly
    BFF-->>FE: 200 OK + cookie
    FE-->>Mhs: Redirect ke /mahasiswa/dashboard
```

---

## 3. Auth Guard — Per-Request

> Berlaku untuk setiap endpoint yang dilindungi (`authGuardPlugin`)

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client (FE / BFF)
    participant Plugin as authGuardPlugin (Elysia)
    participant BA as BetterAuth
    participant DB as PostgreSQL
    participant Casbin as CasbinService
    participant Handler as Route Handler

    Client->>Plugin: HTTP Request + Cookie / Bearer token

    Plugin->>BA: auth.api.getSession({ headers })
    BA->>DB: SELECT session WHERE token = ?
    DB-->>BA: Session + User row
    alt Session tidak ada / expired
        BA-->>Plugin: null
        Plugin-->>Client: 401 Unauthorized
    else Session valid
        BA-->>Plugin: { user, session }
    end

    alt Macro: permission({ resource, action })
        Plugin->>Casbin: checkPermission(userId, resource, action)
        Casbin->>Casbin: enforcer.enforce(userId, resource, action)
        alt Tidak punya izin
            Casbin-->>Plugin: false
            Plugin-->>Client: 403 Forbidden + { userRoles }
        else Punya izin
            Casbin-->>Plugin: true
            Plugin->>Handler: { user, session }
        end
    else Macro: role({ requiredRole })
        Plugin->>Casbin: getUserRoles(userId)
        Casbin-->>Plugin: string[]
        alt Role tidak cocok
            Plugin-->>Client: 403 Forbidden + { requiredRole, userRoles }
        else Role cocok
            Plugin->>Handler: { user, session }
        end
    end

    Handler-->>Client: HTTP Response
```

---

## 4. AK006 Happy Path — Pengajuan s.d. Selesai

```mermaid
sequenceDiagram
    autonumber
    actor Mhs as Mahasiswa
    actor SA as Supervisor Akademik
    actor MTU as Manajer TU
    actor UPA as UPA

    participant FE as Next.js FE
    participant BE as Elysia API
    participant LIS as LetterInstanceService
    participant NS as NotificationService
    participant DB as PostgreSQL

    %% ── STEP 0: Mahasiswa Submit ──
    rect rgb(232, 245, 233)
        note over Mhs,DB: TAHAP 0 — Mahasiswa Mengajukan
        Mhs->>FE: Isi form AK006 + upload lampiran
        FE->>BE: POST /letter/ak006\n{ keperluan, semester, tahunAkademik, attachments, ... }
        BE->>DB: SELECT Mahasiswa WHERE userId = user.id
        DB-->>BE: Mahasiswa data

        BE->>LIS: hasPendingLetter(userId, "AK006")
        LIS->>DB: COUNT LetterInstance WHERE status IN [PENDING, IN_PROGRESS]
        DB-->>LIS: 0 (boleh lanjut)

        BE->>DB: UPSERT LetterType WHERE name = "AK006"
        BE->>DB: SELECT LetterTemplate WHERE isActive = true (snapshot)

        BE->>LIS: create({ letterTypeId, createdById, schema, values, templateConfig, attachments })
        LIS->>LIS: generateTemporaryAgenda()\n→ "001/UN7.F8.4/AK/TBD/2025"
        LIS->>DB: INSERT LetterInstance (status=PENDING, currentStep=1)
        LIS->>DB: INSERT LetterApprovalStep (step=0, status=APPROVED, actor=mahasiswa)
        LIS->>DB: INSERT LetterApprovalStep (step=1, status=PENDING)
        LIS->>DB: INSERT Attachment[] (jika ada)
        DB-->>LIS: LetterInstance

        BE->>NS: notifySANewLetter(letterId, mahasiswaName, type)
        NS->>DB: SELECT UserRole WHERE role.name = 'supervisor_akademik'
        NS->>DB: SELECT UserRole WHERE role.name = 'superadmin'
        NS->>DB: INSERT Notification[] (NEEDS_VERIFICATION)
        BE-->>FE: 200 { success: true, data: letter }
        FE-->>Mhs: "Pengajuan berhasil dikirim"
    end

    %% ── STEP 1: SA Verifikasi ──
    rect rgb(227, 242, 253)
        note over SA,DB: TAHAP 1 — Supervisor Akademik Verifikasi
        SA->>FE: Buka inbox SA → GET /letter/ak006/sa/pending
        FE->>BE: GET /letter/ak006/sa/pending (role: supervisor_akademik)
        BE->>LIS: getPendingForStep(1, "AK006")
        LIS->>DB: SELECT LetterInstance WHERE currentStep=1 AND status IN [PENDING, IN_PROGRESS]
        DB-->>LIS: Letter[]
        BE-->>FE: Daftar surat pending
        FE-->>SA: Tampilkan daftar surat

        SA->>FE: Klik surat → verifikasi → Approve
        FE->>BE: POST /letter/ak006/sa/:id/verify { action: "approve", comments? }
        BE->>LIS: approveStep(letterId, userId, "supervisor_akademik", comments)

        LIS->>DB: BEGIN TRANSACTION
        LIS->>DB: UPDATE LetterApprovalStep SET status=APPROVED\nWHERE letterInstanceId=id AND stepNumber=1 AND status=PENDING
        LIS->>DB: UPDATE LetterInstance SET currentStep=2, status=IN_PROGRESS
        LIS->>DB: INSERT LetterApprovalStep (step=2, status=PENDING)
        LIS->>DB: COMMIT
        DB-->>LIS: Updated LetterInstance

        BE->>NS: notifyMTULetterVerified(letterId, name, type)
        NS->>DB: INSERT Notification[] untuk role 'manager_tu' + 'superadmin'
        BE->>NS: notifyMahasiswaVerified(mahasiswaId, letterId, type)
        NS->>DB: INSERT Notification untuk Mahasiswa (LETTER_VERIFIED)
        BE-->>FE: 200 "Letter forwarded to MTU"
        FE-->>SA: "Surat berhasil diverifikasi"
    end

    %% ── STEP 2a: MTU Sign ──
    rect rgb(252, 228, 236)
        note over MTU,DB: TAHAP 2a — Manajer TU Tanda Tangan
        MTU->>FE: Buka inbox → GET /letter/ak006/mtu/pending
        FE->>BE: GET (role: manager_tu)
        BE->>LIS: getPendingForStep(2, "AK006")
        DB-->>BE: Letter[] pending MTU
        FE-->>MTU: Daftar surat

        MTU->>FE: Buka surat → klik "Tanda Tangan"
        FE->>BE: POST /letter/ak006/mtu/:id/sign\n{ signatureId? | signatureUrl? }
        BE->>DB: SELECT Signature WHERE userId = MTU.id (default)
        DB-->>BE: Signature { imageUrl }
        BE->>LIS: signLetter(letterId, actorId, signatureUrl)
        LIS->>DB: UPDATE LetterInstance SET signatureUrl = ?
        DB-->>LIS: Updated
        BE-->>FE: 200 "Letter signed"
        FE-->>MTU: Preview tanda tangan muncul
    end

    %% ── STEP 2b: MTU Forward ke UPA ──
    rect rgb(252, 228, 236)
        note over MTU,DB: TAHAP 2b — MTU Teruskan ke UPA
        MTU->>FE: Klik "Teruskan ke UPA"
        FE->>BE: POST /letter/ak006/mtu/:id/forward { comments? }
        BE->>DB: CHECK signatureUrl NOT NULL
        BE->>LIS: forwardToUPA(letterId, actorId, comments)
        LIS->>LIS: approveStep(letterId, actorId, "manager_tu")

        LIS->>DB: BEGIN TRANSACTION
        LIS->>DB: UPDATE LetterApprovalStep SET status=APPROVED WHERE stepNumber=2
        LIS->>DB: UPDATE LetterInstance SET currentStep=3, status=IN_PROGRESS
        LIS->>DB: INSERT LetterApprovalStep (step=3, status=PENDING)
        LIS->>DB: COMMIT

        BE->>NS: notifyUPALetterSigned(letterId, name, type)
        NS->>DB: INSERT Notification[] untuk role 'upa' + 'superadmin'
        BE->>NS: notifyMahasiswaSigned(mahasiswaId, letterId, type)
        NS->>DB: INSERT Notification untuk Mahasiswa (LETTER_SIGNED)
        BE-->>FE: 200 "Forwarded to UPA"
        FE-->>MTU: "Surat diteruskan ke UPA"
    end

    %% ── STEP 3: UPA Finalisasi ──
    rect rgb(255, 253, 231)
        note over UPA,DB: TAHAP 3 — UPA Penomoran & Arsip
        UPA->>FE: Buka inbox → GET /letter/ak006/upa/pending
        FE->>BE: GET (role: upa)
        BE->>LIS: getPendingForStep(3, "AK006")
        DB-->>BE: Letter[] pending UPA
        FE-->>UPA: Daftar surat

        UPA->>FE: Klik surat → isi nomor surat → Finalisasi
        FE->>BE: POST /letter/ak006/upa/:id/finalize\n{ letterNumber?, letterDate?, comments? }
        BE->>LIS: finalizeLetter(letterId, actorId, { letterNumber, letterDate })
        LIS->>LIS: generateLetterNumber("AK006")\n→ "001/UN7.F8.4/AK/VI/2025" (jika tidak di-override)
        LIS->>DB: UPDATE LetterInstance SET letterNumber=?, archivedAt=?, archivedById=?
        LIS->>LIS: approveStep(letterId, actorId, "upa")
        LIS->>DB: BEGIN TRANSACTION
        LIS->>DB: UPDATE LetterApprovalStep SET status=APPROVED WHERE stepNumber=3
        LIS->>DB: UPDATE LetterInstance SET status=COMPLETED
        LIS->>DB: COMMIT
        DB-->>LIS: Completed LetterInstance

        BE->>NS: notifyMahasiswaCompleted(mahasiswaId, letterId, type)
        NS->>DB: INSERT Notification (LETTER_COMPLETED) untuk Mahasiswa
        NS->>DB: INSERT Notification untuk 'superadmin'
        BE-->>FE: 200 "Letter completed"
        FE-->>UPA: "Surat berhasil diterbitkan"

        Mhs->>FE: Lihat notif → Download surat
        FE->>BE: GET /letter/ak006/:id
        BE->>LIS: getById(letterId)
        DB-->>BE: LetterInstance { status: COMPLETED, letterNumber, finalDocumentUrl }
        BE-->>FE: Data surat lengkap
        FE-->>Mhs: Tampilkan surat + tombol unduh
    end
```

---

## 5. Revisi oleh SA → Mahasiswa Resubmit

```mermaid
sequenceDiagram
    autonumber
    actor Mhs as Mahasiswa
    actor SA as Supervisor Akademik
    participant BE as Elysia API
    participant LIS as LetterInstanceService
    participant NS as NotificationService
    participant DB as PostgreSQL

    %% SA minta revisi
    SA->>BE: POST /letter/ak006/sa/:id/verify\n{ action: "revision", comments: "Lampiran kurang lengkap" }
    BE->>LIS: requestRevision(letterId, saId, "supervisor_akademik", comments, targetStep=0)

    LIS->>DB: BEGIN TRANSACTION
    LIS->>DB: UPDATE LetterApprovalStep\nSET status=REVISION, actorId=saId, comments=?\nWHERE stepNumber=1 AND status=PENDING
    LIS->>DB: UPDATE LetterInstance\nSET currentStep=0, status=PENDING
    LIS->>DB: COMMIT
    DB-->>LIS: OK

    BE->>NS: notifyMahasiswaRevision(mahasiswaId, letterId, type, comments, "Supervisor Akademik")
    NS->>DB: INSERT Notification { type: REVISION_REQUIRED } untuk Mahasiswa
    NS->>DB: INSERT Notification { type: REVISION_REQUIRED } untuk 'superadmin'
    BE-->>SA: 200 "Revision requested"

    %% Mahasiswa terima notifikasi
    Mhs->>BE: GET /notification (polling atau SSE)
    BE-->>Mhs: Notification { REVISION_REQUIRED, comments }

    %% Mahasiswa perbaiki surat
    Mhs->>BE: PUT /letter/ak006/:id\n{ keperluan, ..., attachments[], comments: "Sudah diperbaiki" }
    Note over BE: Cek: letter.currentStep === 0 → isRevisionForMahasiswa = true
    BE->>LIS: resubmitAfterRevision(letterId, userId, newValues, newAttachments, comments)

    LIS->>DB: DELETE Attachment WHERE letterInstanceId = letterId (lampiran lama)
    LIS->>DB: INSERT Attachment[] (lampiran baru)
    LIS->>DB: UPDATE LetterInstance\nSET values=?, status=PENDING, currentStep=1
    LIS->>DB: INSERT LetterApprovalStep\n(step=0, status=APPROVED, actor=mahasiswa,\ncomments="Mengajukan ulang setelah revisi dari Supervisor Akademik")
    LIS->>DB: INSERT LetterApprovalStep (step=1, status=PENDING)
    DB-->>LIS: Updated

    BE-->>Mhs: 200 "Surat berhasil diajukan ulang"
    Note over SA: SA mendapat notifikasi baru (dari pengajuan ulang)
    SA->>BE: GET /letter/ak006/sa/pending
    BE-->>SA: Surat kembali muncul di inbox SA
```

---

## 6. MTU Revision — ke Mahasiswa atau SA

```mermaid
sequenceDiagram
    autonumber
    actor Mhs as Mahasiswa
    actor SA as Supervisor Akademik
    actor MTU as Manajer TU
    participant BE as Elysia API
    participant LIS as LetterInstanceService
    participant NS as NotificationService
    participant DB as PostgreSQL

    Note over MTU: Surat sudah di Step 2 (MTU)

    alt MTU kirim revisi ke Mahasiswa (targetStep=0)
        MTU->>BE: POST /letter/ak006/mtu/:id/revise\n{ comments: "Data orang tua salah", targetStep: 0 }
        BE->>LIS: requestRevision(letterId, mtuId, "manager_tu", comments, targetStep=0)

        LIS->>DB: UPDATE LetterApprovalStep\nSET status=REVISION WHERE stepNumber=2 AND status=PENDING
        LIS->>DB: UPDATE LetterInstance\nSET currentStep=0, status=PENDING
        DB-->>LIS: OK

        BE->>NS: notifyMahasiswaRevision(mahasiswaId, letterId, type, comments, "Manajer TU")
        NS->>DB: INSERT Notification untuk Mahasiswa (REVISION_REQUIRED)
        BE-->>MTU: 200 "Returned to Mahasiswa"

        Mhs->>BE: PUT /letter/ak006/:id (resubmit)
        Note over BE,DB: Alur sama seperti Diagram 5\n(resubmitAfterRevision → kembali ke Step 1 SA)

    else MTU kirim revisi ke SA (targetStep=1)
        MTU->>BE: POST /letter/ak006/mtu/:id/revise\n{ comments: "Data mahasiswa perlu dikoreksi", targetStep: 1 }
        BE->>LIS: requestRevision(letterId, mtuId, "manager_tu", comments, targetStep=1)

        LIS->>DB: UPDATE LetterApprovalStep\nSET status=REVISION WHERE stepNumber=2 AND status=PENDING
        LIS->>DB: UPDATE LetterInstance\nSET currentStep=1, status=PENDING
        LIS->>DB: INSERT LetterApprovalStep (step=1, status=PENDING)
        DB-->>LIS: OK

        BE->>NS: notifySARevision(letterId, type, mahasiswaName, comments)
        NS->>DB: INSERT Notification untuk role 'supervisor_akademik' (REVISION_REQUIRED)
        NS->>DB: INSERT Notification untuk 'superadmin'
        BE-->>MTU: 200 "Returned to SA"

        SA->>BE: GET /letter/ak006/sa/pending
        BE-->>SA: Surat muncul kembali di inbox SA
        SA->>BE: POST /letter/ak006/sa/:id/verify { action: "approve" }
        Note over BE,DB: Alur approveStep → currentStep kembali ke 2 (MTU)
    end
```

---

## 7. Penolakan (Reject) oleh SA / MTU / UPA

```mermaid
sequenceDiagram
    autonumber
    actor Mhs as Mahasiswa
    participant Aktor as SA / MTU / UPA
    participant BE as Elysia API
    participant LIS as LetterInstanceService
    participant NS as NotificationService
    participant DB as PostgreSQL

    Aktor->>BE: POST /letter/ak006/[role]/:id/[verify/reject] body: action=reject, comments=alasan

    BE->>LIS: rejectStep(letterId, actorId, actorRole, comments)

    LIS->>DB: BEGIN TRANSACTION
    LIS->>DB: UPDATE LetterApprovalStep\nSET status=REJECTED, actorId=?, comments=?\nWHERE stepNumber=currentStep AND status=PENDING
    LIS->>DB: UPDATE LetterInstance SET status=REJECTED
    LIS->>DB: COMMIT
    DB-->>LIS: Rejected LetterInstance

    BE->>NS: notifyMahasiswaRejection(mahasiswaId, letterId, type, comments, rejectorRole)
    NS->>DB: INSERT Notification { type: LETTER_REJECTED, message: "Surat Anda ditolak..." }
    NS->>DB: INSERT Notification untuk 'superadmin'

    BE-->>Aktor: 200 "Letter rejected"

    Mhs->>BE: GET /notification
    BE-->>Mhs: Notification { LETTER_REJECTED, comments }
    Mhs->>BE: GET /letter/ak006/:id
    BE-->>Mhs: LetterInstance { status: REJECTED, approvalSteps }
    Note over Mhs: Mahasiswa dapat mengajukan surat baru\n(surat lama berstatus REJECTED)
```

---

## 8. Upload File ke MinIO

```mermaid
sequenceDiagram
    autonumber
    actor Mhs as Pengguna (Mahasiswa/MTU)
    participant FE as Next.js FE
    participant BFF as Next.js API (BFF)
    participant BE as Elysia API (/upload)
    participant MinIO as MinioService
    participant S3 as MinIO Server (S3)

    Mhs->>FE: Pilih file (lampiran / tanda tangan)
    FE->>BFF: POST /api/upload (multipart/form-data)\n{ file, category: "lampiran"|"signature" }
    BFF->>BE: POST /upload (proxy + forward cookie)
    BE->>BE: Auth guard → validasi session

    BE->>MinIO: uploadFile(file, category)
    MinIO->>MinIO: generateUniqueFileNameWithTimestamp(file.name)
    MinIO->>MinIO: fs.writeFileSync(tempPath, buffer)
    MinIO->>S3: fPutObject(bucket, category+name, tempPath)
    S3-->>MinIO: Upload success
    MinIO->>MinIO: fs.unlinkSync(tempPath)
    MinIO->>S3: presignedUrl("GET", bucket, objectName, 7d)
    S3-->>MinIO: Presigned URL (expired dalam 7 hari)
    MinIO-->>BE: { url: presignedUrl, nameReplace }

    BE-->>BFF: { url, filename, originalName, mimeType, size }
    BFF-->>FE: 200 { url }
    FE->>FE: Simpan url di state / IndexedDB (offline draft)
    FE-->>Mhs: Preview file + URL siap dipakai di form

    Note over FE,BE: URL kemudian dikirim sebagai\nbagian dari body POST /letter/ak006\natau POST /letter/ak006/mtu/:id/sign
```

---

## 9. Notifikasi Fanout ke Role

> Dipakai saat SA approve → perlu notif ke semua user ber-role `manager_tu`

```mermaid
sequenceDiagram
    autonumber
    participant BE as Route Handler
    participant NS as notificationService
    participant DB as PostgreSQL
    participant FE1 as FE Pengguna A (MTU)
    participant FE2 as FE Pengguna B (MTU)

    BE->>NS: notifyMTULetterVerified(letterId, mahasiswaName, letterType)
    NS->>DB: SELECT UserRole JOIN User\nWHERE role.name = 'manager_tu'
    DB-->>NS: [{ userId: A }, { userId: B }]

    loop Untuk setiap user ber-role MTU
        NS->>DB: INSERT Notification {\n  userId, type: NEEDS_SIGNATURE,\n  title, message, letterInstanceId\n}
    end
    NS->>DB: INSERT Notification untuk 'superadmin' (parallel)
    DB-->>NS: Notifications created

    NS-->>BE: Notification[]

    FE1->>BE: GET /notification (polling)
    BE->>DB: SELECT Notification WHERE userId=A AND isRead=false
    DB-->>BE: [Notification { NEEDS_SIGNATURE }]
    BE-->>FE1: Notifikasi baru

    FE2->>BE: GET /notification (polling)
    BE-->>FE2: Notifikasi baru

    FE1->>BE: PATCH /notification/:id/read
    BE->>DB: UPDATE Notification SET isRead=true WHERE id=? AND userId=A
    BE-->>FE1: 200 OK

    FE1->>BE: PATCH /notification/read-all
    BE->>DB: UPDATE Notification SET isRead=true WHERE userId=A AND isRead=false
    BE-->>FE1: 200 Semua notif ditandai terbaca
```

---

## Ringkasan Alur Utama

```mermaid
flowchart TD
    A([Mahasiswa Submit]) --> B{Validasi\nPending?}
    B -- Ada pending --> ERR1[❌ 400 Already Pending]
    B -- Tidak ada --> C[Create LetterInstance\nstatus=PENDING, step=1\nTemporary Agenda generated]
    C --> D[Notif SA: NEEDS_VERIFICATION]

    D --> E{SA Tindakan}
    E -- Approve --> F[step=2 MTU, status=IN_PROGRESS\nNotif MTU + Mahasiswa]
    E -- Reject --> G[status=REJECTED\nNotif Mahasiswa]
    E -- Revision --> H[step=0 Mahasiswa\nNotif Mahasiswa]
    H --> A2([Mahasiswa Resubmit])
    A2 --> D

    F --> I{MTU Tindakan}
    I -- Sign + Forward --> J[step=3 UPA, status=IN_PROGRESS\nNotif UPA + Mahasiswa]
    I -- Reject --> G
    I -- Revisi ke Mahasiswa --> H
    I -- Revisi ke SA --> K[step=1 SA\nNotif SA]
    K --> E

    J --> L{UPA Tindakan}
    L -- Finalize --> M[status=COMPLETED\nLetterNumber assigned\nNotif Mahasiswa]
    L -- Reject --> G
    L -- Revisi ke Mahasiswa --> H
    L -- Revisi ke SA --> K

    M --> N([✅ Surat Selesai\nMahasiswa Download])
```
