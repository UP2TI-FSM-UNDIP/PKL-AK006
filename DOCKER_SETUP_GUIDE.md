# Docker & Database Setup Guide - E-Office Monorepo

Complete guide untuk setup Docker dan database untuk E-Office project. Panduan ini mencakup semua layanan yang dibutuhkan: PostgreSQL, pgAdmin, MinIO, dan Backend API.

## 📋 Prerequisites

Sebelum memulai, pastikan sudah install:

1. **Docker Desktop** (includes Docker & Docker Compose)
   - macOS: https://www.docker.com/products/docker-desktop
   - Windows: https://www.docker.com/products/docker-desktop
   - Linux: https://docs.docker.com/engine/install/

2. **Git**
   - https://git-scm.com/downloads

3. **Node.js & Bun** (untuk development lokal)
   - Node.js: https://nodejs.org/ (v18+)
   - Bun: https://bun.sh/

### Verify Installation

```bash
# Check Docker
docker --version
docker-compose --version

# Check Node & Bun
node --version
bun --version

# Check Git
git --version
```

## 🏗️ Project Structure

```
e-office-monorepo/
├── e-office-api-v2/
│   ├── docker-compose.yml      # Docker services (PostgreSQL, pgAdmin, MinIO)
│   ├── Dockerfile              # Backend API container
│   ├── .env                     # Environment variables
│   ├── prisma/                 # Database schema & migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── db/
│   │   │   ├── seed.ts         # Database seeding script
│   │   │   └── index.ts
│   │   └── index.ts
│   └── package.json
│
└── e-office-webapp-v2/
    ├── .env.local              # Frontend env variables
    └── package.json
```

## 🚀 Quick Start (5 Minutes)

### 1. Clone Repository

```bash
git clone <repository-url>
cd e-office-monorepo
```

### 2. Start Docker Services

```bash
cd e-office-api-v2

# Start PostgreSQL, pgAdmin, MinIO
docker-compose up -d
```

Wait untuk services dimulai (~30 detik). Lihat status dengan:

```bash
docker-compose ps
```

Expected output:
```
CONTAINER ID   IMAGE                    STATUS
xxx            postgres:16-alpine       Up (healthy)
xxx            dpage/pgadmin4:latest    Up
xxx            minio/minio:latest       Up
```

### 3. Setup Backend Database

```bash
# Generate Prisma client
bun prisma generate

# Run database migrations
bun prisma migrate deploy

# Seed database dengan data demo
bun run src/db/seed.ts
```

### 4. Start Backend API

```bash
# Start development server
bun run dev
```

API akan berjalan di: **http://localhost:3001**

### 5. Setup Frontend (Terminal Baru)

```bash
cd e-office-webapp-v2

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend akan berjalan di: **http://localhost:3000**

## 📊 Akses Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend App** | http://localhost:3000 | Login dengan demo accounts |
| **Backend API** | http://localhost:3001 | - |
| **pgAdmin** | http://localhost:5050 | `admin@example.com` / `admin` |
| **MinIO Console** | http://localhost:9001 | `minioadmin` / `minioadmin` |
| **PostgreSQL** | `localhost:5432` | `e-office-api-v2` / `90d467e0d673bc1a8fba21ed` |

## 🔐 Demo User Accounts

Setelah running seed script, gunakan akun berikut untuk testing:

| Role | Email | Password | Function |
|------|-------|----------|----------|
| **Mahasiswa** | mahasiswa@demo.local | password | Membuat surat |
| **Supervisor Akademik** | sa@demo.local | password | Verifikasi surat |
| **Manajer TU** | mtu@demo.local | password | Tanda tangan surat |
| **UPA** | upa@demo.local | password | Penomoran & arsip |

## 🐳 Docker Services Explanation

### PostgreSQL (Port 5432)

**Fungsi**: Database utama untuk aplikasi

**Konfigurasi** (`docker-compose.yml`):
```yaml
postgres:
  image: postgres:16-alpine
  container_name: e-office-api-v2-postgres
  environment:
    POSTGRES_USER: e-office-api-v2
    POSTGRES_PASSWORD: 90d467e0d673bc1a8fba21ed
    POSTGRES_DB: e-office-api-v2
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

**Koneksi String** (di `.env`):
```
DATABASE_URL="postgresql://e-office-api-v2:90d467e0d673bc1a8fba21ed@localhost:5432/e-office-api-v2"
```

Saat running via Docker Compose, host berubah:
```
DATABASE_URL="postgresql://e-office-api-v2:90d467e0d673bc1a8fba21ed@postgres:5432/e-office-api-v2"
```

### pgAdmin (Port 5050)

**Fungsi**: Web UI untuk manage database PostgreSQL

**Cara Akses**:
1. Buka http://localhost:5050
2. Login: `admin@example.com` / `admin`
3. Add server PostgreSQL:
   - Name: `e-office-postgres`
   - Host: `postgres` (atau `localhost` jika running locally)
   - Port: `5432`
   - Username: `e-office-api-v2`
   - Password: `90d467e0d673bc1a8fba21ed`

### MinIO (Ports 9000, 9001)

**Fungsi**: Object storage untuk upload files (PDF, images, etc)

**Akses**:
- **API**: http://localhost:9000 (for application use)
- **Console**: http://localhost:9001 (management UI)
- **Credentials**: `minioadmin` / `minioadmin`

**Setup Bucket** (first time):
1. Buka http://localhost:9001
2. Login dengan `minioadmin` / `minioadmin`
3. Klik **Create Bucket**
4. Bucket name: `e-office`
5. Klik **Create**

## 📝 Database Schema Overview

Aplikasi menggunakan Prisma ORM dengan PostgreSQL. Key tables:

```
User → Account, Session, UserRole
Role → UserRole, RolePermission
Permission → RolePermission
Mahasiswa → User, ProgramStudi, Departemen
Pegawai → User
LetterType → LetterInstance
LetterInstance → LetterApprovalStep
```

**Naming Convention**:
- Prisma code: PascalCase (tables), camelCase (columns)
- Database: snake_case (automatic via @map)

Contoh:
```prisma
model LetterInstance {
  id              String    @id @default(cuid())
  letterNumber    String?
  
  @@map("letter_instance")  // Maps to snake_case in DB
}
```

## 🔄 Development Workflow

### Daily Setup

**Hari pertama atau setup baru**:
```bash
# 1. Start services
cd e-office-api-v2
docker-compose up -d

# 2. Install & setup backend
bun install
bun prisma generate
bun prisma migrate deploy
bun run src/db/seed.ts

# 3. Setup frontend
cd ../e-office-webapp-v2
npm install
```

**Hari-hari biasa** (services sudah running):
```bash
# Terminal 1: Backend
cd e-office-api-v2
bun run dev

# Terminal 2: Frontend
cd e-office-webapp-v2
npm run dev
```

### Membuat Database Changes

```bash
# 1. Update schema.prisma
nano e-office-api-v2/prisma/schema.prisma

# 2. Create migration
cd e-office-api-v2
bun prisma migrate dev --name description_of_change

# 3. Generate Prisma client
bun prisma generate

# 4. Restart API (press Ctrl+C dan run bun run dev lagi)
```

### Lihat Data Database

**Option 1: Prisma Studio** (Recommended)
```bash
cd e-office-api-v2
bun prisma studio
```
Opens at http://localhost:5555 - visual database explorer

**Option 2: pgAdmin**
- http://localhost:5050
- Query database dengan SQL

**Option 3: Command Line**
```bash
# Connect to database
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2

# Example queries
\dt                          # List tables
SELECT * FROM "user";        # Query users
\q                          # Quit
```

## 🔧 Docker Commands

### Manage Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View status
docker-compose ps

# View logs
docker-compose logs -f              # All services
docker-compose logs -f postgres     # Specific service
docker-compose logs -f minio

# Restart a service
docker-compose restart postgres

# View resource usage
docker stats
```

### Database Access

```bash
# Execute psql command
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2

# Backup database
docker-compose exec postgres pg_dump -U e-office-api-v2 e-office-api-v2 > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U e-office-api-v2 e-office-api-v2
```

## ⚠️ Troubleshooting

### 1. Port Already in Use

**Error**: `Port 5432 is already allocated`

**Solution**:
```bash
# Option A: Kill existing process
lsof -i :5432
kill -9 <PID>

# Option B: Change port in docker-compose.yml
# Change "5432:5432" to "5433:5432"
# Update DATABASE_URL to use port 5433

# Option C: Stop other Docker containers
docker-compose down
```

### 2. Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps | grep postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Wait 30 seconds then test
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2 -c "SELECT 1"
```

### 3. Prisma Errors

**Error**: `Prisma Client not found`

**Solution**:
```bash
cd e-office-api-v2

# Regenerate Prisma client
bun prisma generate

# If still failing, remove and reinstall
rm -rf node_modules/.prisma
rm -rf src/generated
bun install
bun prisma generate
```

### 4. Migration Issues

**Error**: `Migration failed` atau `Can't access database`

**Solution**:
```bash
cd e-office-api-v2

# Check migration status
bun prisma migrate status

# Reset database (⚠️ DELETES ALL DATA)
bun prisma migrate reset

# Then reseed
bun run src/db/seed.ts
```

### 5. MinIO Bucket Error

**Error**: `Bucket not found` atau `Access denied`

**Solution**:
1. Access MinIO Console: http://localhost:9001
2. Login dengan `minioadmin` / `minioadmin`
3. Create bucket named `e-office`
4. Set bucket policy to public (untuk development)

### 6. Frontend Can't Connect to API

**Error**: `API connection failed` atau `CORS error`

**Solution**:
```bash
# Check API is running
curl http://localhost:3001

# Check frontend .env.local
cat e-office-webapp-v2/.env.local

# Should have:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# If wrong, update and restart frontend
npm run dev
```

## 🔄 Environment Variables

### Backend (`.env`)

```env
# Database
DATABASE_URL="postgresql://e-office-api-v2:90d467e0d673bc1a8fba21ed@localhost:5432/e-office-api-v2"

# Server
PORT=3001
BASE_URL=http://localhost:3001
NODE_ENV=development

# API URLs
API_URL=${BASE_URL}/api
FE_URL=http://localhost:3000

# Auth
JWT_SECRET="3fc2e130e412fea36a22f6f3"
BETTER_AUTH_SECRET="IbsQN9IlVJpqgc1NC8ZXSunw0QtZmdIVWJS5KVOSxJI="
BETTER_AUTH_URL=http://localhost:3001

# Optional: MinIO (if using object storage)
# MINIO_ENDPOINT=localhost
# MINIO_PORT=9000
# MINIO_ACCESS_KEY=minioadmin
# MINIO_SECRET_KEY=minioadmin
```

### Frontend (`.env.local`)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Application
NEXT_PUBLIC_APP_NAME="E-Office"
NEXT_PUBLIC_APP_VERSION="2.0.0"

# Auth
BETTER_AUTH_SECRET="IbsQN9IlVJpqgc1NC8ZXSunw0QtZmdIVWJS5KVOSxJI="
BETTER_AUTH_URL=http://localhost:3000

# Features
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB
```

## 📚 Useful Resources

- **Prisma Documentation**: https://www.prisma.io/docs/
- **Prisma Studio**: Visual database explorer built-in
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **pgAdmin Docs**: https://www.pgadmin.org/docs/
- **MinIO Docs**: https://docs.min.io/

## 🔐 Security Notes

⚠️ **DEVELOPMENT ONLY**:
- Credentials di `.env` adalah default untuk development
- JANGAN gunakan di production
- JANGAN commit `.env` ke git
- Buat `.env.local` untuk local overrides

## ✅ Verification Checklist

Setelah setup, verifikasi dengan:

- [ ] `docker-compose ps` menunjukkan 3 services running
- [ ] `bun prisma studio` dapat membuka http://localhost:5555
- [ ] `curl http://localhost:3001` return API response
- [ ] Frontend dapat login dengan demo accounts
- [ ] MinIO bucket `e-office` created
- [ ] pgAdmin dapat connect ke PostgreSQL

## 🆘 Need Help?

1. **Check logs**: `docker-compose logs -f`
2. **Restart service**: `docker-compose restart <service>`
3. **Check documentation**: See resources above
4. **Ask team**: Hubungi tech lead

---

**Happy coding!** 🚀
