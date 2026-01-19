# E-Office Monorepo

Sistem E-Office terintegrasi dengan arsitektur monorepo menggunakan Bun workspaces.

## 📋 Deskripsi Proyek

E-Office adalah sistem manajemen surat elektronik yang terdiri dari dua aplikasi utama:
- **Backend API (e-office-api-v2)**: REST API menggunakan Elysia.js dan Prisma
- **Frontend Web (e-office-webapp-v2)**: Aplikasi web menggunakan Next.js 16

## 🏗️ Struktur Proyek

```
e-office-monorepo/
├── e-office-api-v2/          # Backend API
│   ├── src/                  # Source code
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── middlewares/      # Middleware functions
│   │   └── lib/              # Utility libraries
│   ├── prisma/               # Database schema & migrations
│   └── casbin/               # Authorization model
│
├── e-office-webapp-v2/       # Frontend Web Application
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   ├── context/          # React contexts
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utility functions
│   └── public/               # Static assets
│
├── package.json              # Root workspace configuration
└── tsconfig.base.json        # Shared TypeScript config
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.1.6 atau lebih tinggi
- Node.js v20 atau lebih tinggi
- PostgreSQL database
- MinIO atau S3-compatible storage (optional)

### Instalasi

1. Clone repository:
```bash
git clone <repository-url>
cd e-office-monorepo
```

2. Install dependencies:
```bash
bun install
```

3. Setup environment variables:
```bash
# Copy example environment files
cp e-office-api-v2/.env.example e-office-api-v2/.env
cp e-office-webapp-v2/.env.example e-office-webapp-v2/.env

# Edit .env files dengan konfigurasi Anda
```

4. Setup database:
```bash
cd e-office-api-v2
bun run prisma migrate dev
bun run prisma db seed
```

### Menjalankan Aplikasi

#### Development Mode

Jalankan kedua aplikasi secara bersamaan:

```bash
# Terminal 1 - Backend API
cd e-office-api-v2
bun run dev

# Terminal 2 - Frontend Web
cd e-office-webapp-v2
bun run dev
```

Backend API akan berjalan di: `http://localhost:3001`
Frontend Web akan berjalan di: `http://localhost:3000`

#### Production Mode

```bash
# Build semua aplikasi
bun run build

# Start backend API
cd e-office-api-v2
bun run start

# Start frontend (di terminal berbeda)
cd e-office-webapp-v2
bun run start
```

## 📦 Teknologi Stack

### Backend (e-office-api-v2)

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Bun | ^1.3.2 | JavaScript runtime & package manager |
| Elysia.js | ^1.4.19 | Web framework |
| Prisma | ^6.19.0 | ORM & database toolkit |
| Better Auth | ^1.4.6 | Authentication library |
| Casbin | ^5.45.0 | Authorization library (RBAC) |
| MinIO | ^8.0.6 | Object storage client |
| Zod | ^4.2.1 | Schema validation |
| Biome | ^2.3.5 | Linter & formatter |

### Frontend (e-office-webapp-v2)

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Next.js | 16.0.8 | React framework |
| React | 19.2.1 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Styling framework |
| Radix UI | - | Headless UI components |
| Lucide React | ^0.562.0 | Icon library |
| Eden Treaty | ^1.4.5 | Type-safe API client |

## 🗄️ Database Schema

Database menggunakan PostgreSQL dengan Prisma ORM. Skema utama meliputi:

- **User**: Pengguna sistem
- **Account**: OAuth accounts
- **Session**: User sessions
- **Role**: User roles
- **Permission**: System permissions
- **RolePermission**: Role-permission mapping
- **Departemen**: Departments
- **Pegawai**: Staff/employees
- **Mahasiswa**: Students
- **LetterTemplate**: Letter templates
- **LetterInstance**: Letter instances
- **Attachment**: File attachments

Lihat detail di [e-office-api-v2/prisma/schema.prisma](e-office-api-v2/prisma/schema.prisma)

## 🔐 Authentication & Authorization

### Authentication (Better Auth)

Sistem menggunakan Better Auth untuk autentikasi dengan fitur:
- Email/Password login
- Session management
- Email verification
- Password reset

### Authorization (Casbin)

RBAC (Role-Based Access Control) menggunakan Casbin dengan model:
- **Subject**: User/Role
- **Object**: Resource/Endpoint
- **Action**: HTTP Method (GET, POST, PUT, DELETE)
- **Effect**: Allow/Deny

Model konfigurasi: [e-office-api-v2/casbin/model.conf](e-office-api-v2/casbin/model.conf)

## 📁 File Storage

MinIO digunakan untuk penyimpanan file dengan konfigurasi:
- Documents bucket: `e-office-documents`
- Attachments bucket: `e-office-attachments`
- Public access untuk file tertentu

## 🔧 Scripts

### Root Level

```bash
bun install              # Install semua dependencies
```

### Backend (e-office-api-v2)

```bash
bun run dev             # Development mode dengan hot reload
bun run start           # Production mode
bun run lint            # Check code dengan Biome
bun run lint:fix        # Fix code issues
```

### Frontend (e-office-webapp-v2)

```bash
bun run dev             # Development server
bun run build           # Production build
bun run start           # Start production server
bun run lint            # ESLint check
```

## 🐳 Docker Support

Backend API mendukung containerization dengan Docker:

```bash
cd e-office-api-v2

# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up
```

## 📝 API Documentation

API documentation tersedia melalui Swagger UI saat menjalankan backend:

```
http://localhost:3001/swagger
```

## 🧪 Testing

```bash
# Backend tests
cd e-office-api-v2
bun test

# Frontend tests
cd e-office-webapp-v2
bun test
```

## 📈 Development Workflow

1. **Branching Strategy**: Gunakan Git Flow
   - `main`: Production-ready code
   - `develop`: Development branch
   - `feature/*`: Feature branches
   - `hotfix/*`: Hotfix branches

2. **Commit Convention**: 
   ```
   feat: Tambah fitur baru
   fix: Perbaikan bug
   docs: Update dokumentasi
   style: Format code
   refactor: Refactoring code
   test: Tambah/update tests
   chore: Maintenance tasks
   ```

3. **Code Review**: Semua PR harus di-review sebelum merge

## 🚧 Roadmap

- [ ] Unit testing & integration testing
- [ ] CI/CD pipeline setup
- [ ] Performance monitoring
- [ ] API rate limiting
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)

## 👥 Tim Pengembang

| Role | Nama | Contact |
|------|------|---------|
| Backend Developer | - | - |
| Frontend Developer | - | - |
| UI/UX Designer | - | - |
| Project Manager | - | - |

## 📄 License

Private - All rights reserved

## 🆘 Support

Untuk bantuan atau pertanyaan, hubungi:
- Email: support@eoffice.com
- Slack: #eoffice-dev
- Issue Tracker: GitHub Issues

---

**Last Updated**: January 2026
**Version**: 2.0.0
