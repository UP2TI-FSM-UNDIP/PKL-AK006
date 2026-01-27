# Database Management Guide - E-Office

Panduan lengkap untuk manage database PostgreSQL dalam E-Office project. Mencakup migrations, seeding, backup, dan troubleshooting.

## 📚 Table of Contents

1. [Database Architecture](#database-architecture)
2. [Prisma Migrations](#prisma-migrations)
3. [Database Seeding](#database-seeding)
4. [Backup & Restore](#backup--restore)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

## 🏗️ Database Architecture

### Overview

E-Office menggunakan **PostgreSQL 16** dengan **Prisma ORM** untuk manage schema dan migrations.

### Database Credentials

```
Host:     localhost (or postgres in Docker)
Port:     5432
Database: e-office-api-v2
User:     e-office-api-v2
Password: 90d467e0d673bc1a8fba21ed
```

### Key Tables

```
Authentication & Authorization:
├── User (id, email, name, emailVerified, image)
├── Account (social login)
├── Session (auth sessions)
├── Role (admin, supervisor_akademik, manager_tu, upa)
├── Permission (resource + action)
└── UserRole & RolePermission (mapping tables)

Domain Models:
├── Mahasiswa (student info)
├── Pegawai (employee info)
├── Departemen (department)
├── ProgramStudi (study program)
├── LetterType (letter templates: AK006, etc)
├── LetterInstance (actual letters)
└── LetterApprovalStep (workflow steps)
```

## 🔄 Prisma Migrations

### Understanding Migrations

**Prisma Migrations** adalah versi control untuk database schema.

- Setiap change ke `schema.prisma` membuat file migration
- Migrations bisa di-apply ke database atau di-reset
- Semua migrations disimpan di `prisma/migrations/`

### Workflow untuk Schema Changes

#### 1. Update Schema

```bash
cd e-office-api-v2

# Edit schema.prisma
nano prisma/schema.prisma
```

**Example**: Tambah field ke User model

```prisma
model User {
  id            String @id @default(cuid())
  name          String
  email         String @unique
  phoneNumber   String?  // ← NEW FIELD
  
  // ... rest of model
}
```

#### 2. Create Migration

```bash
# Automatically detect changes dan create migration file
bun prisma migrate dev --name add_phone_number_to_user
```

Kamu diminta memberi nama untuk migration. Use format:
- `add_<field>_to_<table>`
- `remove_<field>_from_<table>`
- `create_<table>`
- `update_<table>_<description>`

Prisma akan:
1. ✅ Create migration file di `prisma/migrations/`
2. ✅ Apply migration ke database
3. ✅ Generate Prisma client

#### 3. Generate Prisma Client

```bash
bun prisma generate
```

Atau automatic saat running `migrate dev`.

#### 4. Restart API

```bash
# Stop API (Ctrl+C)
# Start lagi:
bun run dev
```

### Common Migration Commands

```bash
# Create migration (recommended untuk dev)
bun prisma migrate dev --name <migration_name>

# Apply existing migrations
bun prisma migrate deploy

# Check migration status
bun prisma migrate status

# Reset database (⚠️ DELETES DATA)
bun prisma migrate reset

# Create migration without applying (advanced)
bun prisma migrate create --name <migration_name>

# Resolve stuck migration
bun prisma migrate resolve --rolled-back <migration_name>
```

## 🌱 Database Seeding

### Seed Script

Seed script di `src/db/seed.ts` initializes database dengan:
- Demo users (mahasiswa, SA, MTU, UPA)
- Letter types (AK006, etc)
- Roles dan permissions
- Sample data untuk testing

### Running Seeds

#### First Time Setup

```bash
cd e-office-api-v2

# Run seed
bun run src/db/seed.ts
```

#### Re-seed (after reset)

```bash
# Reset (⚠️ DELETES ALL DATA)
bun prisma migrate reset

# This automatically runs seed.ts at the end
```

#### Manual Reset and Seed

```bash
# Reset database
bun prisma migrate reset

# Or manually:
bun prisma db push --skip-generate
bun run src/db/seed.ts
```

### Seed Script Structure

Located at: `e-office-api-v2/src/db/seed.ts`

```typescript
// Example structure
import { prisma } from "./index";

async function main() {
  // 1. Create roles
  const adminRole = await prisma.role.create({ data: { name: "admin" } });
  
  // 2. Create demo users
  const user = await prisma.user.create({
    data: {
      email: "demo@example.com",
      name: "Demo User"
    }
  });
  
  // 3. Create relationships
  await prisma.userRole.create({
    data: { userId: user.id, roleId: adminRole.id }
  });
}

main()
  .then(() => console.log("✅ Seed completed"))
  .catch(err => console.error("❌ Seed failed:", err));
```

## 💾 Backup & Restore

### Manual Backup

#### Using pg_dump (Best)

```bash
# Create backup
docker-compose exec postgres pg_dump -U e-office-api-v2 \
  -d e-office-api-v2 > backup_$(date +%Y%m%d_%H%M%S).sql

# List backups
ls -la *.sql
```

#### Backup ke Custom Format

```bash
# Compressed backup (smaller file)
docker-compose exec postgres pg_dump -U e-office-api-v2 \
  -d e-office-api-v2 -F c > backup.dump
```

### Restore Backup

#### From SQL Dump

```bash
# Method 1: Pipe to psql
cat backup_20250127_120000.sql | \
  docker-compose exec -T postgres psql -U e-office-api-v2 -d e-office-api-v2

# Method 2: Load file
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2 \
  < backup_20250127_120000.sql
```

#### From Custom Format

```bash
docker-compose exec postgres pg_restore -U e-office-api-v2 \
  -d e-office-api-v2 backup.dump
```

### Automated Daily Backup Script

Create `backup-db.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
DAYS_TO_KEEP=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec postgres pg_dump -U e-office-api-v2 \
  -d e-office-api-v2 > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

echo "✅ Backup created: $BACKUP_FILE.gz"

# Delete old backups (older than 7 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$DAYS_TO_KEEP -delete

echo "✅ Old backups cleaned"
```

Make executable dan run via cron:

```bash
chmod +x backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /path/to/backup-db.sh
```

## 🔍 Common Tasks

### View All Tables

```bash
# Via Prisma Studio (Recommended)
bun prisma studio

# Or via psql
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2

# In psql:
\dt        # List all tables
\d <table> # Describe table
```

### Query Database

#### Using Prisma Studio

```bash
bun prisma studio
# Opens http://localhost:5555
# Visual interface untuk browse data
```

#### Using psql

```bash
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2

# Example queries
SELECT * FROM "user";
SELECT * FROM "role";
SELECT * FROM "letter_instance";
SELECT COUNT(*) FROM "user";

# Exit
\q
```

### Check Database Size

```bash
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2 -c \
  "SELECT pg_size_pretty(pg_database_size('e_office_api_v2'));"
```

### List All Columns in Table

```bash
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2 -c \
  "\d letter_instance"
```

### Drop Table (⚠️ Careful!)

```bash
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2 -c \
  "DROP TABLE IF EXISTS table_name CASCADE;"

# Then regenerate Prisma client
bun prisma generate
```

### Reset Sequence (ID Counter)

```bash
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2 -c \
  "SELECT setval('table_name_id_seq', (SELECT MAX(id) FROM table_name));"
```

## 🐛 Troubleshooting

### Migration Locked

**Error**: `Migration engine requested the query engine to acquire a lock`

**Solution**:
```bash
# Restart database
docker-compose restart postgres

# Wait 30 seconds
sleep 30

# Try migration again
bun prisma migrate deploy
```

### Can't Connect to Database

**Error**: `Can't reach database server at...`

**Solution**:
```bash
# 1. Check if PostgreSQL running
docker-compose ps postgres

# 2. View logs
docker-compose logs postgres

# 3. Restart database
docker-compose restart postgres

# 4. Check connection
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2 -c "SELECT 1"
```

### Prisma Client Out of Sync

**Error**: `Prisma Client not found` atau type mismatch

**Solution**:
```bash
cd e-office-api-v2

# Regenerate client
bun prisma generate

# Or:
rm -rf src/generated/prisma
bun prisma generate

# Restart API
# (Ctrl+C and bun run dev)
```

### Unique Constraint Violation

**Error**: `unique constraint` when seeding

**Solution**:
```bash
# Reset database
bun prisma migrate reset

# This deletes data and re-runs seed
```

### Migration File Conflict

**Error**: Migration timestamp conflict or duplicate

**Solution**:
```bash
# Rename migration (in prisma/migrations/)
# Format: YYYYMMDDHHMMSS_name

# Then resolve
bun prisma migrate resolve --rolled-back <migration_name>
```

### Foreign Key Constraint Error

**Error**: `violates foreign key constraint`

**Cause**: Trying to delete record that's referenced by another

**Solution**:
```bash
# Option 1: Delete referencing records first
DELETE FROM referenced_table WHERE id = ...;
DELETE FROM original_table WHERE id = ...;

# Option 2: Update CASCADE behavior in schema
model Parent {
  children Child[]
}

model Child {
  parent   Parent @relation(onDelete: Cascade)
  parentId String
}

# Then create migration
bun prisma migrate dev --name add_cascade_delete
```

### Database Bloat

**Symptoms**: Slow queries, large database size

**Solution**:
```bash
# VACUUM to reclaim space
docker-compose exec postgres psql -U e-office-api-v2 -d e-office-api-v2 -c \
  "VACUUM FULL ANALYZE;"

# This may take time on large databases
```

## 🔑 Tips & Best Practices

1. **Always backup before major changes**
   ```bash
   docker-compose exec postgres pg_dump -U e-office-api-v2 -d e-office-api-v2 > backup.sql
   ```

2. **Test migrations locally first**
   - Create on dev database
   - Verify works before deploying

3. **Use descriptive migration names**
   - ❌ `update_schema`
   - ✅ `add_phone_number_to_user`

4. **Never modify migration files after creation**
   - If wrong, create new migration to fix

5. **Keep seed.ts updated**
   - Add demo data for new models
   - Makes onboarding easier

6. **Use Prisma Studio for quick checks**
   ```bash
   bun prisma studio
   ```

7. **Check migration status before deploy**
   ```bash
   bun prisma migrate status
   ```

## 📖 Schema Documentation

### User Model

```prisma
model User {
  id              String    @id @default(cuid())
  name            String
  email           String    @unique
  emailVerified   Boolean   @default(false)
  image           String?
  
  // Relations
  accounts        Account[]
  sessions        Session[]
  userRoles       UserRole[]
  mahasiswa       Mahasiswa?
  pegawai         Pegawai?
  
  @@map("user")
}
```

### LetterInstance Model

```prisma
model LetterInstance {
  id              String    @id @default(cuid())
  letterTypeId    String
  createdById     String
  status          String    // PENDING, IN_PROGRESS, COMPLETED, REJECTED
  currentStep     Int       // 1=SA, 2=MTU, 3=UPA
  letterNumber    String?   // Generated by UPA
  
  // Relations
  letterType      LetterType @relation(fields: [letterTypeId], references: [id])
  createdBy       User       @relation(fields: [createdById], references: [id])
  approvalSteps   LetterApprovalStep[]
  
  @@map("letter_instance")
}
```

---

**Need help?** Check Docker logs: `docker-compose logs -f postgres`
