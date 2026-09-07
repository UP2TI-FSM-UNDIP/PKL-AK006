# E-Office Web Application v2

Frontend web application untuk sistem E-Office menggunakan Next.js 16 dengan App Router.

## 📋 Deskripsi

Aplikasi web modern untuk manajemen surat elektronik dengan antarmuka yang responsif dan user-friendly.

## 🏗️ Arsitektur

```
e-office-webapp-v2/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Homepage
│   │   ├── globals.css               # Global styles
│   │   ├── favicon.ico               # App favicon
│   │   ├── auth/                     # Authentication pages
│   │   ├── mahasiswa/                # Student pages
│   │   ├── manajer-tu/               # Manajer TU pages
│   │   ├── supervisor-akademik/      # Academic supervisor pages
│   │   ├── upa/                      # UPA pages
│   │   └── surat-keterangan-aktif-kuliah/  # Active student letter pages
│   │
│   ├── components/                   # React Components
│   │   ├── title.tsx                 # Page title component
│   │   ├── FormSurat/                # Letter form components
│   │   ├── layouts/                  # Layout components
│   │   └── ui/                       # UI primitives (shadcn/ui)
│   │
│   ├── context/                      # React Context
│   │   ├── Provider.tsx              # Global providers
│   │   └── AK006.tsx                 # AK006 form context
│   │
│   ├── hooks/                        # Custom Hooks
│   │   └── use-file-upload.ts        # File upload hook
│   │
│   └── lib/                          # Utilities
│       ├── api.ts                    # API client (Eden Treaty)
│       ├── helpers.ts                # Helper functions
│       ├── indexedDB.ts              # IndexedDB utilities
│       └── utils.ts                  # Common utils (cn, etc)
│
├── public/                           # Static Assets
│   ├── icon/                         # Icons & SVG assets
│   │   └── manajer-tu-icon/          # Manajer TU specific icons
│   ├── template/                     # Letter templates
│   ├── file.svg                      # Static SVG files
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── components.json                   # shadcn/ui config
├── eslint.config.mjs                 # ESLint configuration
├── next.config.ts                    # Next.js config
├── next-env.d.ts                     # Next.js TypeScript declarations
├── postcss.config.mjs                # PostCSS config
├── tailwind.config.ts                # Tailwind CSS config
└── tsconfig.json                     # TypeScript config
```

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Variables

Buat file `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=30000

# Application
NEXT_PUBLIC_APP_NAME="E-Office"
NEXT_PUBLIC_APP_VERSION="2.0.0"

# Features
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB
```

### 3. Run Development Server

```bash
bun run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 4. Build for Production

```bash
bun run build
bun run start
```

## 🎨 UI Components

Proyek ini menggunakan [shadcn/ui](https://ui.shadcn.com/) untuk komponen UI:

### Menambah Component Baru

```bash
bunx shadcn@latest add button
bunx shadcn@latest add form
bunx shadcn@latest add dialog
```

### Available Components

Komponen yang sudah ada di `src/components/ui/`:
- Button
- Input
- Form
- Dialog
- Tooltip
- Card
- Badge
- dll.

## 🔌 API Integration

### Eden Treaty Client

Type-safe API client menggunakan Eden Treaty:

```typescript
// lib/api.ts
import { treaty } from '@elysiajs/eden'
import type { App } from 'e-office-api-v2'

export const api = treaty<App>(process.env.NEXT_PUBLIC_API_URL!)

// Usage
const { data, error } = await api.master.user.get()
```

### API Hooks Pattern

```typescript
// Example: useFetchUsers hook
export function useFetchUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await api.master.user.get()
      setUsers(data)
      setLoading(false)
    }
    fetchUsers()
  }, [])

  return { users, loading }
}
```

## 📱 Features

### 1. Authentication

- Login/Logout
- Register
- Password reset
- Session management

### 2. Dashboard

- Overview statistik
- Recent activities
- Quick actions

### 3. Letter Management

#### Surat Keterangan Aktif Kuliah (AK006)
- Create new letter
- Fill form with student data
- Upload attachments
- Preview before submit
- Track status

#### Letter Templates
- Browse available templates
- Search & filter
- Preview template

### 4. Master Data

- User management
- Role & permission
- Department management
- Employee management
- Student management

### 5. File Management

- Upload files
- Preview documents
- Download attachments
- Manage file storage

### 6. Offline Support

IndexedDB untuk offline storage:

```typescript
// lib/indexedDB.ts
import { get, set, del } from 'idb-keyval'

// Save data offline
await set('draft-letter', letterData)

// Retrieve data
const draft = await get('draft-letter')

// Delete data
await del('draft-letter')
```

## 🎨 Styling

### Tailwind CSS

Utility-first CSS framework dengan custom configuration:

```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...}
      }
    }
  }
}
```

### Global Styles

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... */
  }
}
```

### Component Styling

```tsx
import { cn } from '@/lib/utils'

export function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md bg-primary text-white",
        className
      )}
      {...props}
    />
  )
}
```

## 🔄 State Management

### React Context

```typescript
// context/Provider.tsx
export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')

  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  )
}
```

### Custom Hooks

```typescript
// hooks/use-auth.ts
export function useAuth() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAuth must be used within AppProvider')
  return {
    user: context.user,
    login: async (email, password) => {...},
    logout: async () => {...}
  }
}
```

## 📂 Routing

Next.js App Router dengan file-based routing:

```
app/
├── page.tsx                  # / (home)
├── layout.tsx                # Root layout
├── manajer-tu/
│   ├── page.tsx              # /manajer-tu
│   └── layout.tsx            # Manajer TU layout
└── surat-keterangan-aktif-kuliah/
    ├── page.tsx              # /surat-keterangan-aktif-kuliah
    └── [id]/
        └── page.tsx          # /surat-keterangan-aktif-kuliah/[id]
```

### Dynamic Routes

```tsx
// app/letter/[id]/page.tsx
export default function LetterDetailPage({ params }: { params: { id: string } }) {
  const letterId = params.id
  // Fetch letter data
  return <div>Letter {letterId}</div>
}
```

### Loading & Error States

```tsx
// app/letter/loading.tsx
export default function Loading() {
  return <Spinner />
}

// app/letter/error.tsx
export default function Error({ error, reset }: { error: Error, reset: () => void }) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## 🧪 Testing

```bash
# Run tests
bun test

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t e-office-webapp:latest .

# Run container
docker run -p 3000:3000 e-office-webapp:latest
```

### Static Export

```bash
# next.config.ts
export default {
  output: 'export'
}

# Build
bun run build

# Output in ./out directory
```

## 🔧 Configuration

### Next.js Config

```typescript
// next.config.ts
const config: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'your-api-domain.com']
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
  }
}
```

### TypeScript Config

```json
// tsconfig.json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 📊 Performance

- ✅ Code splitting dengan dynamic imports
- ✅ Image optimization dengan next/image
- ✅ Font optimization dengan next/font
- ✅ Route prefetching
- ✅ Static site generation (SSG)
- ✅ Incremental static regeneration (ISR)

### Bundle Analysis

```bash
# Install analyzer
bun add @next/bundle-analyzer

# Run analysis
ANALYZE=true bun run build
```

## 🔒 Security

- ✅ XSS protection
- ✅ CSRF protection
- ✅ Content Security Policy
- ✅ Secure headers
- ✅ Input sanitization

## 📱 Progressive Web App (PWA)

TODO: Add PWA support with:
- Service worker
- Offline functionality
- App manifest
- Push notifications

## 🌐 Internationalization (i18n)

TODO: Add multi-language support

## 🐛 Troubleshooting

### Build Error

```bash
# Clear .next cache
rm -rf .next
bun run build
```

### Type Error

```bash
# Regenerate types
cd ../e-office-api-v2
bun run generate:types
```

### Module Not Found

```bash
# Clear node_modules
rm -rf node_modules
bun install
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Eden Treaty Documentation](https://elysiajs.com/eden/treaty/overview.html)

---

**Version**: 2.0.0
**Last Updated**: January 2026
