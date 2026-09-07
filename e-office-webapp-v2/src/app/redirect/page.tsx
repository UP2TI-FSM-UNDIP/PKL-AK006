'use client';

// Halaman /redirect — menangani Flow B (Portal-initiated SSO).
// SSO Portal langsung redirect browser ke:
//   https://apps-fsm.undip.ac.id/persuratan-penyataan-masih-kuliah/redirect?token=...
// Apache strip prefix → Next.js terima: GET /redirect?token=...
//
// Logika identik dengan /sso/callback (Flow A).

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { withBasePath } from '@/lib/navigation';
import { setAuthToken, API_BASE_URL } from '@/lib/api';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

async function fetchMe(token: string) {
  const res = await fetch(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Gagal memuat profil pengguna');
  return res.json();
}

const roleRedirectMap: Record<string, string> = {
  mahasiswa: '/mahasiswa/dashboard-mahasiswa',
  supervisor_akademik: '/supervisor-akademik/dashboard',
  manager_tu: '/manajer-tu/dashboard-persuratan',
  manajer_tu: '/manajer-tu/dashboard-persuratan',
  upa: '/upa/dashboard',
  superadmin: '/superadmin/dashboard',
};

function RedirectComponent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    const process = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/sso/set-session?token=${encodeURIComponent(token)}`,
          { credentials: 'include' },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Gagal mengaktifkan sesi SSO.');
        }

        setAuthToken(token);

        const userData = await fetchMe(token);
        const data = userData.data || userData;
        const roles: string[] = data.roles ?? [];

        let redirectPath = '/';
        for (const role of roles) {
          const normalized = role.toLowerCase();
          if (roleRedirectMap[normalized]) {
            redirectPath = roleRedirectMap[normalized];
            break;
          }
        }

        window.location.href = withBasePath(redirectPath);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses sesi SSO.';
        setError(msg);
      }
    };

    process();
  }, [token]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-red-600 dark:text-red-400 font-bold mb-2 text-lg">Autentikasi Gagal</h2>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <a
            href={withBasePath('/auth')}
            className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Kembali ke Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-gray-600 dark:text-gray-400">Mengonfirmasi identitas SSO...</p>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      }
    >
      <RedirectComponent />
    </Suspense>
  );
}
