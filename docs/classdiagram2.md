# Class Diagram 2 — E-Office Monorepo (FSM UNDIP)

> Format: **Mermaid** · Pola **BCE (Boundary-Control-Entity)** · Entity hanya atribut, controller langsung akses entity (tanpa service layer)

---

## 1. Boundary Layer (Frontend Pages)

```mermaid
classDiagram
direction LR

class LoginPage {
  <<boundary>>
  +handleSubmit()
}
class SSOPage {
  <<boundary>>
  +activate()
}
class MahasiswaPage {
  <<boundary>>
  +fetchData()
  +handleNewApplication()
  +handleCardClick()
}
class SupervisorAkademikPage {
  <<boundary>>
  +fetchLetter()
  +handleAction()
  +handleSave()
}
class ManajerTUPage {
  <<boundary>>
  +handleBeriTandaTangan()
  +handleConfirmSign()
  +handleKirimSurat()
}
class UPAPage {
  <<boundary>>
  +fetchLetter()
  +handleNomorSuratChange()
  +handleFinalize()
}
class SuperadminPage {
  <<boundary>>
  +handleCreateMahasiswa()
  +handleCreatePegawai()
  +handleUpdateUser()
  +handleResetUserPassword()
  +handleAssignRole()
  +handleRemoveRole()
  +handleDeleteUser()
}

LoginPage ..> PublicController : calls
SSOPage ..> SSOController : calls
MahasiswaPage ..> AK006Controller : calls
SupervisorAkademikPage ..> AK006SAController : calls
ManajerTUPage ..> AK006MTUController : calls
ManajerTUPage ..> SignatureController : calls
UPAPage ..> AK006UPAController : calls
SuperadminPage ..> SuperadminController : calls
```

---

## 2. Domain Models (Entity)

```mermaid
classDiagram
direction LR

%% ─── User & Profile ───
class User {
  <<entity>>
  +String name
  +String email
}
class Mahasiswa {
  <<entity>>
  +String nim
  +String tahunMasuk
  +String noHp
  +String alamat?
  +String tempatLahir?
  +DateTime tanggalLahir?
}
class Pegawai {
  <<entity>>
  +String nip
  +String jabatan
  +String noHp?
}

%% ─── RBAC ───
class Role {
  <<entity>>
  +String name
}
class Permission {
  <<entity>>
  +String resource
  +String action
}
class UserRole {
  <<entity>>
}
class RolePermission {
  <<entity>>
}

%% ─── Struktur Akademik ───
class Departemen {
  <<entity>>
  +String name
  +String code
}
class ProgramStudi {
  <<entity>>
  +String name
  +String code
}

%% ─── Letter Domain ───
class LetterType {
  <<entity>>
  +String name
}
class LetterTemplate {
  <<entity>>
  +String versionName
  +Boolean isActive
  +DateTime createdAt
}
class LetterInstance {
  <<entity>>
  +LetterStatus status
  +Int currentStep
  +String temporaryAgenda?
  +String letterNumber?
  +String signatureUrl?
  +String finalDocumentUrl?
  +DateTime archivedAt?
}
class LetterApprovalStep {
  <<entity>>
  +Int stepNumber
  +ApprovalStepStatus status
  +String comments?
  +String actorRole?
}
class Attachment {
  <<entity>>
  +String filename
  +String originalName
  +String url
}
class Signature {
  <<entity>>
  +String imageUrl
  +Boolean isDefault
  +DateTime createdAt
}
class Notification {
  <<entity>>
  +NotificationType type
  +String title
  +String message
  +Boolean isRead
  +DateTime createdAt
}

%% ─── Relations ───
User "1" --> "0..1" Mahasiswa : profile
User "1" --> "0..1" Pegawai : profile
User "1" --> "0..*" UserRole : belongs to
User "1" --> "0..*" LetterInstance : createdBy
User "1" --> "0..*" LetterInstance : archivedBy
User "1" --> "0..*" LetterApprovalStep : actor
User "1" --> "0..*" Signature : owns
User "1" --> "0..*" Notification : receives

Role "1" --> "0..*" UserRole : assigned via
Role "1" --> "0..*" RolePermission : grants via
Permission "1" --> "0..*" RolePermission : defined in

Departemen "1" --> "0..*" ProgramStudi : contains
Departemen "1" --> "1..*" Mahasiswa : houses
Departemen "1" --> "0..*" Pegawai : employs
ProgramStudi "1" --> "1..*" Mahasiswa : enrolls
ProgramStudi "1" --> "0..*" Pegawai : assigns

LetterType "1" --> "0..*" LetterTemplate : versions
LetterType "1" --> "0..*" LetterInstance : typed as
LetterInstance "1" --> "1..*" LetterApprovalStep : has steps
LetterInstance "1" --> "0..*" Attachment : carries
LetterInstance "1" --> "0..*" Notification : references
```

---

## 3. Controller Layer (Routes)

```mermaid
classDiagram
direction TB

class SSOController {
  <<control>>
  +handleSSO()
  +redirect()
}

class PublicController {
  <<control>>
  +signIn()
  +register()
}

%% ─── Letter Controllers ───
class AK006Controller {
  <<control>>
  +createLetter()
  +updateLetter()
  +deleteLetter()
}

class AK006SAController {
  <<control>>
  +verifyLetter()
  +updateLetterData()
  +updateStudentData()
}

class AK006MTUController {
  <<control>>
  +signLetter()
  +forwardToUPA()
  +rejectLetter()
  +requestRevision()
}

class AK006UPAController {
  <<control>>
  +finalizeLetter()
}

class SignatureController {
  <<control>>
  +createSignature()
  +setDefaultSignature()
  +deleteSignature()
}

class SuperadminController {
  <<control>>
  +updateLetter()
  +forceApproveLetter()
  +forceRejectLetter()
  +deleteLetter()
  +updateUser()
  +resetUserPassword()
  +assignUserRole()
  +removeUserRole()
  +deleteUser()
  +createMahasiswaUser()
  +createPegawaiUser()
  +updateAK006Template()
  +backfillTemplateConfigs()
  +impersonateUser()
}

class MeController {
  <<control>>
  +completeProfile()
  +changePassword()
}

class NotificationController {
  <<control>>
  +markAsRead()
  +markAllAsRead()
  +deleteNotification()
}

class UploadController {
  <<control>>
  +uploadFile()
}

class MasterCRUDController {
  <<control>>
  +create()
  +update()
  +delete()
}

%% ─── Controller → Entity Dependencies ───
SSOController ..> User : uses
SSOController ..> CasbinService : uses
PublicController ..> User : uses
AK006Controller ..> LetterInstance : uses
AK006Controller ..> Notification : uses
AK006SAController ..> LetterInstance : uses
AK006SAController ..> User : uses
AK006SAController ..> Mahasiswa : uses
AK006SAController ..> Notification : uses
AK006MTUController ..> LetterInstance : uses
AK006MTUController ..> Signature : uses
AK006MTUController ..> Notification : uses
AK006UPAController ..> LetterInstance : uses
AK006UPAController ..> Notification : uses
SignatureController ..> Signature : uses
SuperadminController ..> LetterInstance : uses
SuperadminController ..> User : uses
SuperadminController ..> Notification : uses
SuperadminController ..> EmailService : uses
SuperadminController ..> CasbinService : uses
MeController ..> User : uses
MeController ..> Mahasiswa : uses
MeController ..> Pegawai : uses
NotificationController ..> Notification : uses
UploadController ..> MinioService : uses
UploadController ..> CasbinService : uses
MasterCRUDController ..> User : uses
MasterCRUDController ..> Mahasiswa : uses
MasterCRUDController ..> Pegawai : uses
MasterCRUDController ..> Role : uses
MasterCRUDController ..> Permission : uses
MasterCRUDController ..> Departemen : uses
MasterCRUDController ..> ProgramStudi : uses
MasterCRUDController ..> LetterType : uses
MasterCRUDController ..> LetterTemplate : uses
```

---

## 4. Infrastructure & Auth Layer

```mermaid
classDiagram
direction TB

class MinioService {
  <<control>>
  -client: Client$
  -bucketName: String$
  +ensureBucket()
  +listBucket()
  +uploadFile()
  +downloadFile()
  +getPresignedUrl()
  +getFileStream()
  +listObjects()
  +deleteFile()
}

class EmailService {
  <<control>>
  +sendEmail()
  +sendNewUserWelcomeEmail()
}

class CasbinService {
  <<control>>
  +checkPermission()
  +addPermissionToRole()
  +removePermissionFromRole()
  +assignRoleToUser()
  +removeRoleFromUser()
}

class AuthGuardPlugin {
  <<control>>
  +resolve()
  +macroPermission()
  +macroRole()
}

AuthGuardPlugin --> CasbinService : RBAC check
```

---

## 5. Enums

```mermaid
classDiagram

class LetterStatus {
  <<enumeration>>
  PENDING
  IN_PROGRESS
  COMPLETED
  REJECTED
}

class ApprovalStepStatus {
  <<enumeration>>
  PENDING
  APPROVED
  REJECTED
  REVISION
}

class NotificationType {
  <<enumeration>>
  LETTER_SUBMITTED
  NEEDS_VERIFICATION
  NEEDS_SIGNATURE
  NEEDS_NUMBERING
  REVISION_REQUIRED
  LETTER_REJECTED
  LETTER_COMPLETED
  LETTER_VERIFIED
  LETTER_SIGNED
}

class FieldType {
  <<enumeration>>
  STRING
  NUMBER
  DATE
  FILE
  BOOLEAN
  ENUM
}

class Jenjang {
  <<enumeration>>
  S1
  S2
  S3
}

class TemplateEngine {
  <<enumeration>>
  HANDLEBARS
  RAW
}
```

---

## Ringkasan Perbedaan Diagram 1 vs Diagram 2

| | class-diagram.md | classdiagram2.md |
|---|---|---|
| **Entity** | Hanya atribut | Hanya atribut |
| **Service layer** | Ada (terpisah) | Tidak ada |
| **Controller** | Panggil service | Panggil entity langsung |
| **Pola** | MVC dengan service layer | BCE tanpa service layer |
| **Cocok untuk** | Dokumentasi arsitektur nyata | Diagram UML akademik / sequence diagram |
