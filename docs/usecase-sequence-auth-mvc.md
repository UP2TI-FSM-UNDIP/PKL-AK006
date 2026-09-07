# Use Case & Sequence Diagram — Autentikasi SSO (MVC)

> Format: **Mermaid** · Pola **MVC** · nama kelas & metode sesuai `classdiagram4.md`

---

## Daftar Isi

1. [Use Case Diagram — Autentikasi Semua Pengguna](#1-use-case-diagram--autentikasi-semua-pengguna)
2. [Sequence Diagram — Login via SSO UNDIP](#2-sequence-diagram--login-via-sso-undip)

---

## 1. Use Case Diagram — Autentikasi Semua Pengguna

```mermaid
flowchart LR

%% ─── Actors ───
MHS(["🎓 Mahasiswa"])
SA(["👤 Supervisor Akademik"])
MTU(["👤 Manajer TU"])
UPA(["👤 UPA"])
SADMIN(["🔐 Superadmin"])
SSOENG(["🌐 SSO Engine\nUNDIP"])

subgraph SYS["Sistem E-Office FSM UNDIP"]
    direction TB

    UC1("Login via SSO UNDIP")
    UC2("Validasi Token\nke SSO Engine")
    UC3("Auto-register\nAkun Baru"):::extend
    UC4("Auto-assign Role"):::extend
    UC5("Aktivasi Sesi\nactivate(token)")
    UC6("Redirect ke\nDashboard Role")
    UC7("Logout")
    UC8("Verifikasi Sesi\ntiap Request")
end

MHS    --> UC1
SA     --> UC1
MTU    --> UC1
UPA    --> UC1
SADMIN --> UC1

SSOENG -.->|"memvalidasi"| UC2

UC1 --> UC2
UC2 -.->|"«extend»"| UC3
UC2 -.->|"«extend»"| UC4
UC2 --> UC5
UC5 --> UC6

MHS    --> UC7
SA     --> UC7
MTU    --> UC7
UPA    --> UC7
SADMIN --> UC7

MHS    --> UC8
SA     --> UC8
MTU    --> UC8
UPA    --> UC8
SADMIN --> UC8

classDef extend fill:#fff3cd,stroke:#e0a800,color:#333
```

| Aktor | Metode Login |
|---|---|
| Mahasiswa | SSO UNDIP |
| Supervisor Akademik | SSO UNDIP |
| Manajer TU | SSO UNDIP |
| UPA | SSO UNDIP |
| Superadmin | SSO UNDIP |
| SSO Engine UNDIP | Sistem eksternal — memvalidasi kredensial |

---

## 2. Sequence Diagram — Login via SSO UNDIP

```mermaid
sequenceDiagram
    actor Pengguna as Pengguna

    participant LP  as "«Boundary»\n:LoginPage"
    participant CB  as "«Boundary»\n:SSOCallbackPage"
    participant SC  as "«control»\n:SSOController"
    participant U   as "«entity»\n:User"
    participant R   as "«entity»\n:Role"
    participant UR  as "«entity»\n:UserRole"
    participant EXT as "SSO Engine\nUNDIP"

    Pengguna->>LP: Buka halaman login
    activate LP

    LP->>EXT: Redirect ke SSO Engine UNDIP
    deactivate LP
    activate EXT

    EXT-->>Pengguna: Tampilkan form login SSO
    Pengguna->>EXT: Submit kredensial (username, password)
    EXT->>EXT: Autentikasi kredensial

    EXT->>SC: handleSSO(ssoToken)
    deactivate EXT
    activate SC

    SC->>EXT: GET /users/me (validasi token)
    activate EXT
    EXT-->>SC: {name, username, role}
    deactivate EXT

    SC->>U: findByEmail(username)
    activate U
    U-->>SC: User | null
    deactivate U

    alt [User belum terdaftar]
        SC->>U: create(name, email, emailVerified: true)
        activate U
        U-->>SC: User baru
        deactivate U
    end

    opt [Role ada di SSO_ROLE_MAP]
        SC->>R: findByName(roleName)
        activate R
        R-->>SC: Role
        deactivate R

        SC->>SC: assignRoleToUser(userId, role)

        SC->>UR: create(userId, roleId)
        activate UR
        UR-->>SC: UserRole created
        deactivate UR
    end

    SC-->>EXT: {callback_url: "/redirect?token=<rawToken>"}
    activate EXT
    EXT->>CB: Redirect → /sso/callback?token=<rawToken>
    deactivate EXT
    deactivate SC

    activate CB
    CB->>CB: activate(token)

    CB->>SC: setSession(token)
    activate SC
    SC->>U: findSessionByToken(token)
    activate U
    U-->>SC: Session valid
    deactivate U
    SC-->>CB: Set-Cookie: better-auth.session_token
    deactivate SC

    CB->>SC: GET /me (Bearer token)
    activate SC
    SC->>U: findById(userId)
    activate U
    U-->>SC: User
    deactivate U
    SC->>UR: findByUserId(userId)
    activate UR
    UR-->>SC: [{role: "mahasiswa"}, ...]
    deactivate UR
    SC-->>CB: {id, name, email, roles[]}
    deactivate SC

    CB->>CB: roleRedirectMap[role] → redirectPath
    CB-->>Pengguna: Redirect ke dashboard sesuai role
    deactivate CB
```
