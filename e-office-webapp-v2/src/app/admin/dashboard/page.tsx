'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          window.location.href = `${BASE_PATH}/auth`;
          return;
        }

        const responseData = await response.json();
        const userData = responseData.data || responseData;

        const roles = userData.roles as string[] | undefined;

        const isSuperadminRole = roles?.some((role: string) =>
          role.toLowerCase() === 'superadmin'
        );

        if (!isSuperadminRole) {
          window.location.href = `${BASE_PATH}/auth`;
          return;
        }

        setIsSuperadmin(true);
      } catch (error) {
        console.error('Error checking access:', error);
        window.location.href = `${BASE_PATH}/auth`;
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-[#0B6FB6] animate-spin" />
          <p className="text-lg text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSuperadmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">E-Office System</h1>
        <p className="text-gray-600 mb-8">Sistem Persuratan Digital</p>
        <div className="space-x-4">
          <a
            href={`${BASE_PATH}/mahasiswa/detail-surat`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Mahasiswa
          </a>
          <a
            href={`${BASE_PATH}/manajer-tu/dashboard-persuratan`}
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Manajer TU
          </a>
          <a
            href={`${BASE_PATH}/supervisor-akademik/dashboard`}
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Supervisor Akademik
          </a>
          <a
            href={`${BASE_PATH}/upa/dashboard`}
            className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            UPA
          </a>
        </div>
      </div>
    </div>
  );
}
