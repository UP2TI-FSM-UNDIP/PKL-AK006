# Class Diagram — E-Office FSM UNDIP (Ringkas)

> Format: **Mermaid** · Pola **MVC** · Fokus fitur utama: workflow persetujuan surat AK006

---

## View & Controller

```mermaid
classDiagram
direction LR

%% ─── VIEW ───
class LoginPage {
  <<view>>
  +handleSubmit(username, password)
}
class MahasiswaPage {
  <<view>>
  +fetchData()
  +handleNewApplication()
}
class AK006FormPage {
  <<view>>
  +handleSubmit()
}
class SupervisorAkademikPage {
  <<view>>
  +fetchLetter()
  +handleAction(action, comments)
}
class ManajerTUPage {
  <<view>>
  +handleConfirmSign()
  +handleKirimSurat()
}
class UPAPage {
  <<view>>
  +handleNomorSuratChange()
  +handleFinalize()
}
class SuperadminPage {
  <<view>>
  +handleCreateMahasiswa()
  +handleAssignRole(roleName)
  +handleDeleteUser()
}

%% ─── CONTROLLER ───
class PublicController {
  <<controller>>
  +signIn(username, password)
  +register(name, username, password)
}
class AK006Controller {
  <<controller>>
  +getMyLetters(user)
  +createLetter(body, user)
  +updateLetter(id, body, user)
  +deleteLetter(id, user)
}
class AK006SAController {
  <<controller>>
  +getPendingLetters()
  +verifyLetter(id, action, comments)
}
class AK006MTUController {
  <<controller>>
  +getPendingLetters()
  +signLetter(id, body)
  +forwardToUPA(id)
  +rejectLetter(id, comments)
}
class AK006UPAController {
  <<controller>>
  +getPendingLetters()
  +finalizeLetter(id, body)
  +rejectLetter(id, comments)
}
class SuperadminController {
  <<controller>>
  +createMahasiswaUser(body)
  +assignUserRole(id, role)
  +deleteUser(id)
  +forceApproveLetter(id)
  +updateAK006Template(body)
}

%% ─── View → Controller ───
LoginPage ..> PublicController : calls
MahasiswaPage ..> AK006Controller : calls
AK006FormPage ..> AK006Controller : calls
SupervisorAkademikPage ..> AK006SAController : calls
ManajerTUPage ..> AK006MTUController : calls
UPAPage ..> AK006UPAController : calls
SuperadminPage ..> SuperadminController : calls
```

---

## Model

```mermaid
classDiagram
direction LR

class User {
  <<model>>
  +String id
  +String name
  +String email
}
class Role {
  <<model>>
  +String id
  +String name
}
class LetterInstance {
  <<model>>
  +String id
  +LetterStatus status
  +Int currentStep
  +String temporaryAgenda?
  +String letterNumber?
  +String signatureUrl?
  +String finalDocumentUrl?
}
class LetterApprovalStep {
  <<model>>
  +String id
  +Int stepNumber
  +ApprovalStepStatus status
  +String comments?
  +String actorRole?
}
class LetterType {
  <<model>>
  +String id
  +String name
}
class LetterTemplate {
  <<model>>
  +String id
  +String versionName
  +Boolean isActive
}
class Signature {
  <<model>>
  +String id
  +String imageUrl
  +Boolean isDefault
}
class Notification {
  <<model>>
  +String id
  +NotificationType type
  +String title
  +Boolean isRead
}

User "1" --> "0..*" Role : has
User "1" --> "0..*" LetterInstance : creates
User "1" --> "0..*" Signature : owns
User "1" --> "0..*" Notification : receives

LetterType "1" --> "0..*" LetterTemplate : versions
LetterType "1" --> "0..*" LetterInstance : typed as
LetterInstance "1" --> "1..*" LetterApprovalStep : has steps
LetterInstance "1" --> "0..*" Notification : triggers
```

---

## Enums

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
}
```

---

## Ringkasan

| Layer | Komponen Utama |
|---|---|
| `<<view>>` | LoginPage, MahasiswaPage, AK006FormPage, SA/MTU/UPA/SuperadminPage |
| `<<controller>>` | PublicController, AK006Controller, AK006SAController, AK006MTUController, AK006UPAController, SuperadminController |
| `<<model>>` | User, Role, LetterInstance, LetterApprovalStep, LetterType, LetterTemplate, Signature, Notification |
