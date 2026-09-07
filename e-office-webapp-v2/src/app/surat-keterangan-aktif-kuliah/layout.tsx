import TopBar from '@/components/layouts/TopBar';
import React from 'react';
import { ProfileProvider } from '@/context/AK006';
import StepGuard from '@/app/surat-keterangan-aktif-kuliah/components/StepGuard';
import { MultiStepProvider } from '@/context/Provider';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

async function getStudentData() {
  try {
    // Get cookies to forward to API
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    // Fetch user data from API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20022';
    const res = await fetch(`${backendUrl}/me`, {
      headers: {
        'Cookie': cookieHeader,
      },
      cache: 'no-store',
    });

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      console.error('Failed to fetch user data:', res.status);
      return {};
    }

    const responseData = await res.json();
    const userData = responseData.data || responseData; // Handle standardized API response

    // Map API response to ProfileData format
    return {
      nama_lengkap: userData.name || '',
      role: userData.roles?.[0] || 'Mahasiswa',
      nim: userData.mahasiswa?.nim || '',
      email: userData.email || '',
      departemen: userData.mahasiswa?.departemen?.name || '',
      program_studi: userData.mahasiswa?.programStudi?.name || '',
      tempat_lahir: userData.mahasiswa?.tempatLahir || '',
      tanggal_lahir: userData.mahasiswa?.tanggalLahir
        ? new Date(userData.mahasiswa.tanggalLahir).toISOString().split('T')[0]
        : '',
      no_hp: userData.mahasiswa?.noHp || '',
      alamat: userData.mahasiswa?.alamat || '',
      jenis_surat: 'AK 006',
    };
  } catch (error) {
    console.error('Error fetching student data:', error);
    return {};
  }
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const DBData = await getStudentData();

  if (DBData === null) {
    redirect('/auth');
  }

  return (
    <ProfileProvider initialData={DBData}>
      <StepGuard>
        <div className='min-h-screen bg-gray-50 w-full'>
          <TopBar role='Mahasiswa' />
          <main>{children}</main>
        </div>
      </StepGuard>
    </ProfileProvider>
  );
}
