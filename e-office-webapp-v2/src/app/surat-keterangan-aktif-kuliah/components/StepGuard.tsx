'use client';
import { useProfile } from '@/context/AK006';
import { useRouter } from '@/hooks/use-app-router'
import { usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

// 1. Tipe data eksplisit untuk ROUTES agar tidak error "any"
const ROUTES: Record<string, number> = {
  '/surat-keterangan-aktif-kuliah/identitas-pemohon': 0,
  '/surat-keterangan-aktif-kuliah/detail-pengajuan': 1,
  '/surat-keterangan-aktif-kuliah/lampiran': 2,
  '/surat-keterangan-aktif-kuliah/review': 3,
};

interface StepGuardProps {
  children: ReactNode;
}

export default function StepGuard({ children }: StepGuardProps) {
  const { reachedStep } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  // 2. Tentukan izin secara sinkron (saat render berjalan)
  const requiredStep = ROUTES[pathname];
  const isAllowed = requiredStep === undefined || reachedStep >= requiredStep;

  useEffect(() => {
    // 3. Jalankan redirect HANYA jika tidak diizinkan
    if (!isAllowed) {
      const allowedRoute = Object.keys(ROUTES).find(
        (route) => ROUTES[route] === reachedStep
      );
      router.replace(
        allowedRoute || '/surat-keterangan-aktif-kuliah/identitas-pemohon'
      );
    }
  }, [isAllowed, reachedStep, router]);

  // 4. Jika tidak diizinkan, jangan tampilkan apa pun (cegah flash content)
  if (!isAllowed) {
    return (
      <div className='flex items-center justify-center p-20 text-slate-400'>
        <p>Memverifikasi hak akses...</p>
      </div>
    );
  }

  return <>{children}</>;
}
