import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verifikasi Dokumen - FSM UNDIP',
  description: 'Halaman verifikasi keaslian dokumen digital Fakultas Sains dan Matematika Universitas Diponegoro',
  robots: {
    index: false, // Don't index verification pages
    follow: false,
  },
};

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
