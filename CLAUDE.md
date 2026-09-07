# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands are run from the **monorepo root** via Bun workspaces.

```bash
# Development
bun dev           # Run API + Web in parallel
bun dev:api       # API only (port 20022)
bun dev:web       # Web only (port 20021)

# Production
bun build         # Build Next.js frontend
bun start:api     # Start API in production mode
bun start:web     # Start web in production mode

# Database
bun db:migrate    # Run Prisma migrations
bun db:seed       # Seed demo data (creates demo users)
bun db:studio     # Open Prisma Studio GUI (port 5555)

# Linting (uses Biome for API, ESLint for web)
bun lint          # Lint both workspaces
bun lint:api      # Biome check on e-office-api-v2/src
bun lint:web      # ESLint on e-office-webapp-v2

# Docker (run from e-office-api-v2/)
docker compose up -d    # Start PostgreSQL, pgAdmin, MinIO
docker compose down     # Stop all services
```

The API uses `bun --watch` for hot reload in dev mode.

## Architecture Overview

### Monorepo Structure

Two Bun workspace packages with TypeScript path aliases defined in `tsconfig.base.json`:
- `@backend/*` → `e-office-api-v2/src/*`
- `@frontend/*` → `e-office-webapp-v2/src/*`

### Backend (`e-office-api-v2`) — Elysia.js REST API

**Entry point:** `src/index.ts` → `src/server.ts`

**Routing:** Uses `elysia-autoload` to auto-discover routes from `src/routes/`. The generated type manifest at `src/autogen.routes.ts` is committed and must be regenerated when routes change. Route files are organized by domain:
- `routes/letter/` — AK006 letter workflow per role: `ak006.ts` (mahasiswa), `ak006-sa.ts` (supervisor), `ak006-mtu.ts` (manajer TU), `ak006-upa.ts` (UPA), `signature.ts`, `superadmin.ts`
- `routes/master/` — CRUD for master data: user, role, permission, mahasiswa, pegawai, departemen, prodi, suratType, suratTemplate
- `routes/public/` — Unauthenticated endpoints: register, sign-in, verify, reference, files, template
- `routes/auth/sso.ts` — UNDIP SSO integration
- `routes/me.ts`, `routes/dash.ts`, `routes/upload.ts`, `routes/notification.ts` — user profile, dashboard, file upload, notifications

**Auth middleware:** `src/middlewares/auth.ts` exports `authGuardPlugin` (an Elysia plugin with `.macro()`) providing two guard macros usable on any route:
- `permission: { resource, action }` — Casbin RBAC check
- `role: { requiredRole }` — direct role membership check

**Auth system:** Better Auth (`src/lib/auth.ts`) with Prisma adapter + anonymous + bearer plugins. Session cookies are HMAC-signed (see the `set-session` handler in `server.ts` for the SSO session exchange flow). The `/api/auth/get-session` endpoint is overridden to inject `roles[]` into the user object.

**Authorization (Casbin):** `src/lib/casbin.ts` — enforcer is a lazy singleton; policies are loaded from the DB (`RolePermission` + `UserRole` tables) at first use. Standard RBAC model: `g(user, role)` → `p(role, resource, action)`.

**Services layer:** `src/services/`
- `services/database_models/` — One service class per Prisma model, all extending `__basicCRUD.ts` which provides `getAll`, `get`, `delete`, `count`. The key domain service is `letterInstance.service.ts` containing `LetterInstanceService` (abstract class with static methods).
- `services/minio.service.ts` — S3/MinIO file operations
- `services/email.service.ts` — SMTP via Nodemailer
- `services/notification.service.ts` — In-app notification fanout

**Database:** Prisma ORM with PostgreSQL. Schema at `prisma/schema.prisma`. Generated client outputs to `src/generated/prisma/`. A secondary `prismabox` generator outputs TypeBox schemas to `src/generated/prismabox/` for use as Elysia validators.

Key domain models: `User` → `Mahasiswa`/`Pegawai` (profile subtypes), `LetterInstance` → `LetterApprovalStep[]` (3-step workflow), `LetterTemplate` (versioned JSON schema), `Signature`, `Notification`.

**Letter approval workflow (3 steps):**
1. `STEP_SA = 1` — Supervisor Akademik verifies
2. `STEP_MTU = 2` — Manajer TU signs (attaches signature image)
3. `STEP_UPA = 3` — UPA assigns letter number and archives

**Linting:** Biome (`biome.json`) — tab indentation, double quotes, import organization on save.

### Frontend (`e-office-webapp-v2`) — Next.js 16 App Router

**API client:** `src/lib/api.ts` exports `client` — an Eden Treaty instance typed directly from the backend's `App` type. This gives end-to-end type safety without a separate schema. The same file also exposes raw `fetch`-based helpers for routes that need custom headers.

**Auth client:** `src/lib/auth-client.ts` — Better Auth React client (`useSession`, `signIn`, `signOut`, `signUp`).

**Next.js API routes (`src/app/api/`)** act as a BFF proxy layer, forwarding requests to the backend and handling session cookies. Key routes: `auth/[...slug]`, `letter/[...path]`, `me`, `upload`, `public/[...path]`.

**Page structure (role-based routing):**
- `/mahasiswa/` — Student dashboard, letter submission multi-step form (identitas-pemohon → lampiran → review)
- `/supervisor-akademik/` — SA dashboard, inbox
- `/manajer-tu/` — MTU dashboard, signature management
- `/upa/` — UPA dashboard, letter numbering
- `/superadmin/` — User, role, letter, settings management
- `/surat-keterangan-aktif-kuliah/` — Shared letter detail/preview
- `/sso/` — SSO callback handling
- `/auth/` — Email/password login

**Navigation sub-path:** The app is deployed behind an Apache reverse proxy that strips a path prefix. Do **not** use `basePath` in `next.config.ts`. Instead, always wrap manual navigation with `withBasePath()` from `src/lib/navigation.ts` (e.g., `router.push(withBasePath('/dashboard'))`). The prefix is set via `NEXT_PUBLIC_BASE_PATH` env var.

**State management:**
- `src/context/AK006.tsx` — Multi-step form state for letter submission
- `src/context/Provider.tsx` — Global provider wrapper
- `src/lib/indexedDB.ts` — Offline draft storage using browser IndexedDB (`EOfficeDB` v2, stores: `attachments`, `uploaded_attachments`)

**Components:**
- `components/ui/` — shadcn/ui primitives (Radix UI + Tailwind CV)
- `components/layouts/` — `ResponsiveLayout`, `SideBar`, `SuperadminSidebar`, `TopBar`, `PageWrapper`
- `components/letter/` — `LetterPreviewCard`, `LetterTimeline`, `AttachmentList`
- `components/FormSurat/` — Dynamic form field components for letter submission
- `components/CompleteProfileModal.tsx` — Modal shown to users who haven't completed their profile

**Custom hooks:**
- `use-file-upload.ts` — File upload to MinIO via the backend
- `use-ak006-template.ts` — Fetches and parses AK006 letter template from API
- `use-app-router.ts` — Wraps Next.js router with `withBasePath`

## Environment Variables

**Backend (`e-office-api-v2/.env`):**
```
DATABASE_URL=          # PostgreSQL connection string
BETTER_AUTH_SECRET=    # HMAC signing secret
BETTER_AUTH_TRUSTED_ORIGINS=  # Comma-separated allowed origins
PORT=20022
FRONTEND_URL=          # Used in SSO redirect
SSO_HOST=              # UNDIP SSO API base URL
SMTP_HOST/PORT/USER/PASS/FROM=  # Email config
# MinIO: configured directly in minio.service.ts via env vars
```

**Frontend (`e-office-webapp-v2/.env`):**
```
NEXT_PUBLIC_API_URL=   # Backend origin (without trailing slash)
NEXT_PUBLIC_BASE_PATH= # Sub-path prefix for Apache proxy (e.g. /persuratan)
```

## Infrastructure

Docker Compose (`e-office-api-v2/docker-compose.yml`) provides:
- PostgreSQL 16 on port 5432
- pgAdmin on port 5050 (admin@example.com / admin)
- MinIO on ports 9000/9001 (minioadmin / minioadmin)
- Backend container on port 3000 (production only, `bot` service)

The backend container (`Dockerfile` in `e-office-api-v2/`) runs in production mode. Dev workflow uses the host Bun process directly.
