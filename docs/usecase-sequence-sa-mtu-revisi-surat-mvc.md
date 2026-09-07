# Sequence Diagram — SA, MTU Memberikan / Merevisi Surat

> Format: **Mermaid** · Pola **MVC (Model-View-Controller)**
>
> Sumber: [`classdiagram5.md`](file:///home/tim2/e-office-monorepo/docs/classdiagram5.md)

---

## Komponen yang Terlibat

| Layer | Komponen | Stereotype |
|---|---|---|
| **View (Boundary)** | `DashboardPage`, `LetterDetailPage` | `<<view>>` |
| **Controller** | `LetterBaseController`, `AK006SAController`, `AK006MTUController`, `RejectController` | `<<controller>>` |
| **Model (Entity)** | `LetterInstance`, `LetterApprovalStep`, `Signature`, `Notification` | `<<model>>` |

---

## 1. SA Memberikan Revisi Surat ke Mahasiswa (Alur Utama)

> SA membuka dashboard, melihat surat pending, lalu meminta revisi ke mahasiswa.

```mermaid
sequenceDiagram
    autonumber

    actor SA as Supervisor Akademik

    participant DP as DashboardPage<<view>>
    participant LDP as LetterDetailPage<<view>>
    participant LBC as LetterBaseController<<controller>>
    participant SAC as AK006SAController<<controller>>
    participant RC as RejectController<<controller>>
    participant LI as LetterInstance<<model>>
    participant LAS as LetterApprovalStep<<model>>
    participant Notif as Notification<<model>>

    %% SA buka dashboard, lihat surat pending
    SA ->> DP: Buka dashboard
    DP ->> LBC: getPendingLetters()
    LBC ->> LI: SELECT WHERE currentStep=1 AND status IN (PENDING, IN_PROGRESS)
    LI -->> LBC: List surat pending
    LBC -->> DP: pendingLetters[]
    DP -->> SA: Tampilkan daftar surat pending

    %% SA klik surat untuk lihat detail
    SA ->> DP: handleCardClick(id)
    DP ->> LDP: Navigate ke detail surat
    LDP ->> LBC: getLetter(id)
    LBC ->> LI: SELECT WHERE id = ?
    LI -->> LBC: LetterInstance data
    LBC -->> LDP: letterData
    LDP ->> LBC: getTimeline(id)
    LBC ->> LAS: SELECT WHERE letterInstanceId = id
    LAS -->> LBC: approvalSteps[]
    LBC -->> LDP: timeline
    LDP -->> SA: Tampilkan detail surat + timeline

    %% SA meminta revisi
    SA ->> LDP: handleRequestRevision(comments, targetStep=0)
    LDP ->> RC: requestRevision(id, comments, targetStep=0)
    RC ->> LAS: UPDATE SET status=REVISION WHERE stepNumber=1
    LAS -->> RC: OK
    RC ->> LI: UPDATE SET currentStep=0, status=PENDING
    LI -->> RC: Updated
    RC ->> Notif: INSERT (type=REVISION_REQUIRED, userId=mahasiswa)
    Notif -->> RC: Created
    RC -->> LDP: { success: true }
    LDP -->> SA: "Revisi berhasil dikirim ke Mahasiswa"
```

---

## 2. MTU Memberikan Revisi Surat ke Mahasiswa (Alur Utama)

> MTU membuka dashboard, melihat surat pending di step 2, lalu meminta revisi ke mahasiswa.

```mermaid
sequenceDiagram
    autonumber

    actor MTU as Manajer TU

    participant DP as DashboardPage<<view>>
    participant LDP as LetterDetailPage<<view>>
    participant LBC as LetterBaseController<<controller>>
    participant RC as RejectController<<controller>>
    participant LI as LetterInstance<<model>>
    participant LAS as LetterApprovalStep<<model>>
    participant Notif as Notification<<model>>

    %% MTU buka dashboard, lihat surat pending
    MTU ->> DP: Buka dashboard
    DP ->> LBC: getPendingLetters()
    LBC ->> LI: SELECT WHERE currentStep=2 AND status=IN_PROGRESS
    LI -->> LBC: List surat pending MTU
    LBC -->> DP: pendingLetters[]
    DP -->> MTU: Tampilkan daftar surat pending

    %% MTU klik surat untuk lihat detail
    MTU ->> DP: handleCardClick(id)
    DP ->> LDP: Navigate ke detail surat
    LDP ->> LBC: getLetter(id)
    LBC ->> LI: SELECT WHERE id = ?
    LI -->> LBC: LetterInstance data
    LBC -->> LDP: letterData
    LDP ->> LBC: getTimeline(id)
    LBC ->> LAS: SELECT WHERE letterInstanceId = id
    LAS -->> LBC: approvalSteps[]
    LBC -->> LDP: timeline
    LDP -->> MTU: Tampilkan detail surat + timeline

    %% MTU meminta revisi ke Mahasiswa
    MTU ->> LDP: handleRequestRevision(comments, targetStep=0)
    LDP ->> RC: requestRevision(id, comments, targetStep=0)
    RC ->> LAS: UPDATE SET status=REVISION WHERE stepNumber=2
    LAS -->> RC: OK
    RC ->> LI: UPDATE SET currentStep=0, status=PENDING
    LI -->> RC: Updated
    RC ->> Notif: INSERT (type=REVISION_REQUIRED, userId=mahasiswa)
    Notif -->> RC: Created
    RC -->> LDP: { success: true }
    LDP -->> MTU: "Revisi berhasil dikirim ke Mahasiswa"
```

---

## 3. MTU Memberikan Revisi Surat ke SA (Alur Utama)

> MTU mengembalikan surat ke SA untuk dikoreksi ulang.

```mermaid
sequenceDiagram
    autonumber

    actor MTU as Manajer TU

    participant LDP as LetterDetailPage<<view>>
    participant RC as RejectController<<controller>>
    participant LI as LetterInstance<<model>>
    participant LAS as LetterApprovalStep<<model>>
    participant Notif as Notification<<model>>

    %% MTU sudah di halaman detail surat (step 2)
    MTU ->> LDP: handleRequestRevision(comments, targetStep=1)
    LDP ->> RC: requestRevision(id, comments, targetStep=1)
    RC ->> LAS: UPDATE SET status=REVISION WHERE stepNumber=2
    LAS -->> RC: OK
    RC ->> LI: UPDATE SET currentStep=1, status=PENDING
    LI -->> RC: Updated
    RC ->> LAS: INSERT (stepNumber=1, status=PENDING)
    LAS -->> RC: Created
    RC ->> Notif: INSERT (type=REVISION_REQUIRED, userId=SA)
    Notif -->> RC: Created
    RC -->> LDP: { success: true }
    LDP -->> MTU: "Surat dikembalikan ke Supervisor Akademik"
```

---

## 4. SA Memberikan Persetujuan (Approve) Surat (Alur Utama)

> SA menyetujui surat dan meneruskan ke MTU — sebagai pembanding alur revisi.

```mermaid
sequenceDiagram
    autonumber

    actor SA as Supervisor Akademik

    participant LDP as LetterDetailPage<<view>>
    participant SAC as AK006SAController<<controller>>
    participant LI as LetterInstance<<model>>
    participant LAS as LetterApprovalStep<<model>>
    participant Notif as Notification<<model>>

    %% SA sudah di halaman detail surat
    SA ->> LDP: handleAction("approve", comments)
    LDP ->> SAC: verifyLetter(id, "approve", comments)
    SAC ->> LAS: UPDATE SET status=APPROVED WHERE stepNumber=1
    LAS -->> SAC: OK
    SAC ->> LI: UPDATE SET currentStep=2, status=IN_PROGRESS
    LI -->> SAC: Updated
    SAC ->> LAS: INSERT (stepNumber=2, status=PENDING)
    LAS -->> SAC: Created
    SAC ->> Notif: INSERT (type=NEEDS_SIGNATURE, role=manager_tu)
    Notif -->> SAC: Created
    SAC -->> LDP: { success: true }
    LDP -->> SA: "Surat berhasil diverifikasi, diteruskan ke MTU"
```

---

## 5. Superadmin — Monitoring Revisi (Ringkas)

> Superadmin hanya memonitor proses melalui dashboard. Alur minimal.

```mermaid
sequenceDiagram
    autonumber

    actor SAdmin as Superadmin

    participant DP as DashboardPage<<view>>
    participant LBC as LetterBaseController<<controller>>
    participant LI as LetterInstance<<model>>
    participant LAS as LetterApprovalStep<<model>>

    SAdmin ->> DP: Buka dashboard
    DP ->> LBC: getPendingLetters()
    LBC ->> LI: SELECT ALL WHERE status IN (PENDING, IN_PROGRESS)
    LI -->> LBC: List semua surat
    LBC -->> DP: pendingLetters[]
    DP -->> SAdmin: Tampilkan semua surat (semua step)

    SAdmin ->> DP: handleCardClick(id)
    DP ->> LBC: getLetter(id)
    LBC ->> LI: SELECT WHERE id = ?
    LI -->> LBC: LetterInstance data
    LBC -->> DP: letterData
    DP ->> LBC: getTimeline(id)
    LBC ->> LAS: SELECT WHERE letterInstanceId = id
    LAS -->> LBC: approvalSteps[]
    LBC -->> DP: timeline
    DP -->> SAdmin: Tampilkan detail + status revisi
```

---

## Ringkasan Alur Revisi

```mermaid
flowchart LR
    subgraph "SA Revisi"
        SA1[SA buka DashboardPage] --> SA2[SA lihat LetterDetailPage]
        SA2 --> SA3{Tindakan?}
        SA3 -- Approve --> SA4[AK006SAController.verifyLetter]
        SA3 -- Revisi --> SA5[RejectController.requestRevision]
    end

    subgraph "MTU Revisi"
        MTU1[MTU buka DashboardPage] --> MTU2[MTU lihat LetterDetailPage]
        MTU2 --> MTU3{Tindakan?}
        MTU3 -- "Revisi ke Mhs (step=0)" --> MTU4[RejectController.requestRevision]
        MTU3 -- "Revisi ke SA (step=1)" --> MTU5[RejectController.requestRevision]
    end

    SA4 --> |currentStep=2| MTU1
    SA5 --> |currentStep=0| MHS[Mahasiswa perbaiki]
    MTU4 --> |currentStep=0| MHS
    MTU5 --> |currentStep=1| SA1
```

---

## Catatan

- Semua nama method (`getPendingLetters`, `getLetter`, `getTimeline`, `requestRevision`, `verifyLetter`, `handleRequestRevision`, `handleAction`, `handleCardClick`) **diambil langsung** dari [classdiagram5.md](file:///home/tim2/e-office-monorepo/docs/classdiagram5.md).
- **Boundary → Controller → Entity** mengikuti aturan MVC/BCE.
- Panah solid (`->>`) = call/request, panah putus-putus (`-->>`) = return/response.
- Superadmin hanya ditampilkan sebagai monitoring (diagram 5), sesuai permintaan "dikit aja".
