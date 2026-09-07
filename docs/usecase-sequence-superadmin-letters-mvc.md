# Sequence Diagram — Super Admin Mengelola Semua Surat

> Use Case: **Super Admin Mengelola Semua Surat**
> Pola: **MVC (Boundary → Controller → Entity)**
> Sumber method: Class Diagram E-Office Monorepo

---

```mermaid
sequenceDiagram
    actor SA as Super Admin

    participant B as SuperadminPage<<boundary>>
    participant C as SuperadminController<<controller>>
    participant E1 as LetterInstance<<entity>>
    participant E2 as LetterApprovalStep<<entity>>

    SA ->> B: Buka halaman kelola surat
    activate B
    B ->> C: getAllLetters()
    activate C
    C ->> E1: findAll()
    activate E1
    E1 -->> C: List<LetterInstance>
    deactivate E1
    C -->> B: daftar semua surat
    deactivate C
    B -->> SA: Tampilkan tabel surat
    deactivate B

    alt Force Approve
        SA ->> B: Klik force approve
        activate B
        B ->> C: forceApproveLetter(id, body)
        activate C
        C ->> E1: findById(id)
        activate E1
        E1 -->> C: LetterInstance
        deactivate E1
        C ->> E2: updateStatus(APPROVED)
        activate E2
        E2 -->> C: updated
        deactivate E2
        C ->> E1: updateStatus(COMPLETED)
        activate E1
        E1 -->> C: updated
        deactivate E1
        C -->> B: success
        deactivate C
        B -->> SA: Notifikasi berhasil
        deactivate B

    else Force Reject
        SA ->> B: Klik force reject
        activate B
        B ->> C: forceRejectLetter(id, comments)
        activate C
        C ->> E1: findById(id)
        activate E1
        E1 -->> C: LetterInstance
        deactivate E1
        C ->> E2: updateStatus(REJECTED)
        activate E2
        E2 -->> C: updated
        deactivate E2
        C ->> E1: updateStatus(REJECTED)
        activate E1
        E1 -->> C: updated
        deactivate E1
        C -->> B: success
        deactivate C
        B -->> SA: Notifikasi berhasil
        deactivate B

    else Hapus Surat
        SA ->> B: Klik hapus surat
        activate B
        B ->> C: deleteLetter(id)
        activate C
        C ->> E1: findById(id)
        activate E1
        E1 -->> C: LetterInstance
        deactivate E1
        C ->> E1: delete(id)
        activate E1
        E1 -->> C: deleted
        deactivate E1
        C -->> B: success
        deactivate C
        B -->> SA: Notifikasi berhasil
        deactivate B
    end
```
