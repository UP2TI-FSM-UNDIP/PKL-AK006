# Class Diagram — E-Office Monorepo (FSM UNDIP)

> Format: **Mermaid** · Pola **MVC (Model-View-Controller)**

---

## 1. View (Frontend Pages)

```mermaid
classDiagram
direction LR

class LoginPage {
  <<view>>
  +handleSubmit(username, password)
}
class SSOCallbackPage {
  <<view>>
  +activate(token)
}
class MahasiswaPage {
  <<view>>
  +fetchData()
  +handleNewApplication()
  +handleCardClick(filterType)
}
class AK006FormPage {
  <<view>>
  +handleIdentitasPemohon()
  +handleLampiran()
  +handleReview()
  +handleSubmit()
}
class SupervisorAkademikPage {
  <<view>>
  +fetchLetter()
  +handleAction(action, comments)
  +handleSave()
}
class ManajerTUPage {
  <<view>>
  +handleBeriTandaTangan()
  +handleConfirmSign()
  +handleKirimSurat()
}
class UPAPage {
  <<view>>
  +fetchLetter()
  +handleNomorSuratChange()
  +handleFinalize()
}
class SuperadminPage {
  <<view>>
  +handleCreateMahasiswa()
  +handleCreatePegawai()
  +handleUpdateUser()
  +handleResetUserPassword()
  +handleAssignRole(roleName)
  +handleRemoveRole(roleName)
  +handleDeleteUser()
  +handleImpersonate()
}
class LetterDetailPage {
  <<view>>
  +fetchLetter(id)
  +handleVerifyDocument()
}

LoginPage ..> PublicController : calls
SSOCallbackPage ..> SSOController : calls
MahasiswaPage ..> AK006Controller : calls
AK006FormPage ..> AK006Controller : calls
SupervisorAkademikPage ..> AK006SAController : calls
ManajerTUPage ..> AK006MTUController : calls
ManajerTUPage ..> SignatureController : calls
UPAPage ..> AK006UPAController : calls
SuperadminPage ..> SuperadminController : calls
LetterDetailPage ..> AK006Controller : calls
```

---

## 2. Controller

```mermaid
classDiagram
direction TB

class PublicController {
  <<controller>>
  +signIn(username, password)
  +register(name, username, password)
}

class SSOController {
  <<controller>>
  +handleSSO(token)
  +assignRoleToUser(userId, role)
}

class AK006Controller {
  <<controller>>
  +getMyLetters(user)
  +getLetter(id)
  +getTimeline(id)
  +createLetter(body, user)
  +updateLetter(id, body, user)
  +deleteLetter(id, user)
}

class LetterBaseController {
  <<controller>>
  +getPendingLetters()
  +getProcessedLetters()
  +getLetter(id)
  +getTimeline(id)
}

class AK006SAController {
  <<controller>>
  +verifyLetter(id, action, comments)
  +updateLetterData(id, body)
  +updateStudentData(id, body)
}

class AK006MTUController {
  <<controller>>
  +signLetter(id, body)
  +forwardToUPA(id, comments)
  +rejectLetter(id, comments)
  +requestRevision(id, comments, targetStep)
}

class AK006UPAController {
  <<controller>>
  +getArchivedLetters()
  +finalizeLetter(id, body)
  +rejectLetter(id, comments)
  +requestRevision(id, comments, targetStep)
}

LetterBaseController <|-- AK006SAController
LetterBaseController <|-- AK006MTUController
LetterBaseController <|-- AK006UPAController

class SignatureController {
  <<controller>>
  +getSignatures(user)
  +createSignature(body, user)
  +setDefaultSignature(id, user)
  +deleteSignature(id, user)
}

class SuperadminController {
  <<controller>>
  +getAllUsers()
  +createMahasiswaUser(body)
  +createPegawaiUser(body)
  +updateUser(id, body)
  +resetUserPassword(id, newPassword)
  +assignUserRole(id, role)
  +removeUserRole(id, roleName)
  +deleteUser(id)
  +getAllLetters()
  +forceApproveLetter(id, body)
  +forceRejectLetter(id, comments)
  +deleteLetter(id)
  +updateAK006Template(body)
}

class MeController {
  <<controller>>
  +getProfile(user)
  +completeProfile(body, user)
  +changePassword(body)
}

class UploadController {
  <<controller>>
  +uploadFile(file, category, user)
}

class MasterController {
  <<controller>>
  +getAll()
  +create(body)
  +update(id, body)
  +delete(id)
}

%% ─── Controller → Model Dependencies ───
PublicController ..> User : uses
SSOController ..> User : uses
AK006Controller ..> LetterInstance : uses
AK006SAController ..> LetterInstance : uses
AK006MTUController ..> LetterInstance : uses
AK006MTUController ..> Signature : uses
AK006UPAController ..> LetterInstance : uses
SignatureController ..> Signature : uses
SuperadminController ..> User : uses
SuperadminController ..> LetterInstance : uses
SuperadminController ..> LetterTemplate : uses
MeController ..> User : uses
MeController ..> Mahasiswa : uses
MeController ..> Pegawai : uses
UploadController ..> Attachment : uses
MasterController ..> User : uses
MasterController ..> Role : uses
MasterController ..> Permission : uses
MasterController ..> Departemen : uses
MasterController ..> ProgramStudi : uses
MasterController ..> LetterType : uses
MasterController ..> LetterTemplate : uses
```

---

## 3. Model

```mermaid
classDiagram
direction LR

%% ─── User & Profile ───
class User {
  <<model>>
  +String id
  +String name
  +String email
  +Boolean emailVerified
  +Boolean isAnonymous?
  +DateTime createdAt?
  +DateTime deletedAt?
}
class Mahasiswa {
  <<model>>
  +String id
  +String nim
  +String tahunMasuk
  +String noHp
  +String alamat?
  +String tempatLahir?
  +DateTime tanggalLahir?
}
class Pegawai {
  <<model>>
  +String id
  +String nip
  +String jabatan
  +String noHp?
}

%% ─── RBAC ───
class Role {
  <<model>>
  +String id
  +String name
}
class Permission {
  <<model>>
  +String id
  +String resource
  +String action
}
class UserRole {
  <<model>>
  +String id
  +String userId
  +String roleId
}
class RolePermission {
  <<model>>
  +String id
  +String roleId
  +String permissionId
}

%% ─── Struktur Akademik ───
class Departemen {
  <<model>>
  +String id
  +String name
  +String code
}
class ProgramStudi {
  <<model>>
  +String id
  +String name
  +String code
  +String departemenId
}

%% ─── Letter Domain ───
class LetterTemplate {
  <<model>>
  +String id
  +String versionName
  +Json schemaDefinition
  +Json formFields
  +Boolean isActive
  +DateTime createdAt
}
class LetterInstance {
  <<model>>
  +String id
  +Json schema
  +Json values
  +Json templateConfig?
  +LetterStatus status
  +Int currentStep
  +String temporaryAgenda?
  +String letterNumber?
  +String signatureUrl?
  +String finalDocumentUrl?
  +DateTime archivedAt?
}
class LetterApprovalStep {
  <<model>>
  +String id
  +Int stepNumber
  +ApprovalStepStatus status
  +String comments?
  +String actorRole?
}
class Attachment {
  <<model>>
  +String id
  +String filename
  +String originalName
  +String mimeType?
  +Int size?
  +String url
}
class Signature {
  <<model>>
  +String id
  +String imageUrl
  +Boolean isDefault
  +DateTime createdAt
}
class Notification {
  <<model>>
  +String id
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
Departemen "1" --> "0..*" Mahasiswa : houses
Departemen "1" --> "0..*" Pegawai : employs
ProgramStudi "1" --> "0..*" Mahasiswa : enrolls
ProgramStudi "1" --> "0..*" Pegawai : assigns

LetterTemplate "1" --> "0..*" LetterInstance : generates
LetterInstance "1" --> "1..*" LetterApprovalStep : has steps
LetterInstance "1" --> "0..*" Attachment : carries
LetterInstance "1" --> "0..*" Notification : triggers
```

---

## 4. Enums

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

## Ringkasan Arsitektur (MVC)

| Layer | Komponen | Tanggung Jawab |
|---|---|---|
| `<<view>>` | Next.js Pages | Tampilan UI per peran pengguna |
| `<<controller>>` | Elysia Routes + Services | Terima request, business logic, akses DB |
| `<<model>>` | Prisma Models | Definisi entitas & relasi database (PostgreSQL) |
