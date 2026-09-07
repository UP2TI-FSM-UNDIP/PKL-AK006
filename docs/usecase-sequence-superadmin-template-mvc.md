# Use Case & Sequence Diagram — Super Admin Mengubah Template (MVC)

> Format: **Mermaid** · Pola **MVC** · nama kelas & metode sesuai `classdiagram4.md`

---

## Daftar Isi

1. [Use Case Diagram — Kelola Template oleh Superadmin](#1-use-case-diagram--kelola-template-oleh-superadmin)
2. [Sequence Diagram — Super Admin Mengubah Template](#2-sequence-diagram--super-admin-mengubah-template)

---

## 1. Use Case Diagram — Kelola Template oleh Superadmin

```mermaid
flowchart LR

%% ─── Actors ───
SADMIN(["🔐 Superadmin"])

subgraph SYS["Sistem E-Office FSM UNDIP"]
    direction TB

    UC1("Mengubah Template AK006 (updateAK006Template)")
    UC2("Menonaktifkan Template Lama")
    UC3("Membuat Versi Template Baru")
end

SADMIN --> UC1
UC1 -.->|"«include»"| UC2
UC1 -.->|"«include»"| UC3
```

---

## 2. Sequence Diagram — Super Admin Mengubah Template

```mermaid
sequenceDiagram
    actor Admin as Superadmin

    participant SP  as "«Boundary»\n:SuperadminPage"
    participant SC  as "«control»\n:SuperadminController"
    participant LT  as "«entity»\n:LetterTemplate"

    Note over Admin, LT: Skenario: Mengubah Template AK006 (updateAK006Template)
    Admin->>SP: Ubah konfigurasi schema/field template & klik "Simpan Template"
    activate SP

    SP->>SC: updateAK006Template(body)
    activate SC

    Note over SC, LT: Mulai Transaction (Prisma $transaction)

    %% Deactivate existing active templates
    SC->>LT: updateMany({isActive: true} -> {isActive: false})
    activate LT
    LT-->>SC: success
    deactivate LT

    %% Count existing templates to generate next version name
    SC->>LT: count()
    activate LT
    LT-->>SC: count
    deactivate LT

    %% Create new active template version
    SC->>LT: create({versionName, schemaDefinition: body.config, isActive: true, ...})
    activate LT
    LT-->>SC: LetterTemplate baru
    deactivate LT

    Note over SC, LT: Selesai Transaction

    SC-->>SP: success (Template AK006 berhasil disimpan)
    deactivate SC
    SP-->>Admin: Tampilkan pesan template berhasil disimpan
    deactivate SP
```
