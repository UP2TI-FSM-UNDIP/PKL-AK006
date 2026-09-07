'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/hooks/use-app-router';
import TopBar from '@/components/layouts/TopBar';

import { Search, Calendar, Eye, Plus, Loader2, Trash2, X, Menu } from 'lucide-react';
import { letterApi, getStatusLabel, getStatusColor, getStepLabel, formatDate, type LetterInstance } from '@/lib/api';

// Mobile card component for letter display
function MobileLetterCard({ letter, onView, onCancel, canCancel }: {
  letter: any;
  onView: () => void;
  onCancel: () => void;
  canCancel: boolean;
}) {
  return (
    <div className={`rounded-lg shadow-sm p-4 space-y-3 border transition-colors duration-300 ${letter.needsAction ? 'border-amber-300 dark:border-amber-600 bg-amber-50/80 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-700' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">No/Agenda</p>
          <p className="font-mono text-sm font-medium truncate text-gray-900 dark:text-white">{letter.agenda}</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs flex-shrink-0 ml-2 dark:text-gray-300">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: letter.statusColor }} />
          {letter.status}
        </span>
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Perihal</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{letter.perihal}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
          <p className="text-gray-900 dark:text-white">{letter.tanggal}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tujuan</p>
          <p className="text-gray-900 dark:text-white">{letter.tujuan}</p>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onView}
          className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Lihat Detail
        </button>
        {canCancel && (
          <button
            onClick={onCancel}
            className="py-2.5 px-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface Letter {
  id: string;
  agenda: string;
  perihal: string;
  tanggal: string;
  tanggalISO: string;
  tujuan: string;
  status: string;
  statusColor: string;
  rawStatus: string;
  currentStep: number;
  needsAction: boolean;
}

export default function SuratSayaPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('surat-saya');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingLetterId, setCancellingLetterId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch letters from API
  useEffect(() => {
    const fetchLetters = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await letterApi.getMyLetters();

        if (response.success && response.data) {
          const mappedLetters: Letter[] = response.data.map((item: LetterInstance) => {
            // Jika currentStep adalah 0 dan status PENDING, itu berarti surat dikembalikan untuk revisi
            // (karena surat baru step 0 statusnya APPROVED dan langsung ke step 1)
            const isRevision = item.currentStep === 0 && item.status === 'PENDING';

            return {
              id: item.id,
              agenda: item.letterNumber || 'Belum dinomori',
              perihal: item.letterType?.name || 'Surat Pernyataan Masih Kuliah',
              tanggal: formatDate(item.createdAt),
              tanggalISO: item.createdAt.split('T')[0],
              // Jika step 0, tujuannya adalah Mahasiswa (diri sendiri)
              tujuan: item.currentStep === 0 ? 'Mahasiswa' : getStepLabel(item.currentStep),
              status: isRevision ? 'Perlu Revisi' : getStatusLabel(item.status),
              statusColor: isRevision ? '#FB923C' : getStatusColor(item.status),
              rawStatus: item.status,
              currentStep: item.currentStep,
              needsAction: isRevision || (item.currentStep === 0 && item.status === 'REVISION'),
            };
          });
          setLetters(mappedLetters);
        } else {
          setError(response.message || 'Gagal memuat data surat');
        }
      } catch (err) {
        console.error('Error fetching letters:', err);
        setError('Gagal memuat data surat. Pastikan server API berjalan.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLetters();
  }, []);

  // Cancel letter handler
  const handleCancelLetter = async () => {
    if (!cancellingLetterId) return;

    setIsCancelling(true);
    try {
      const response = await letterApi.cancelLetter(cancellingLetterId);
      if (response.success) {
        // Remove the cancelled letter from the list
        setLetters(prev => prev.filter(l => l.id !== cancellingLetterId));
        setShowCancelModal(false);
        setCancellingLetterId(null);
        // alert('Pengajuan surat berhasil dibatalkan');
      } else {
        console.error(response.message || 'Gagal membatalkan surat');
      }
    } catch (err) {
      console.error('Error cancelling letter:', err);
      console.error('Gagal membatalkan surat');
    } finally {
      setIsCancelling(false);
    }
  };

  // Check if letter can be cancelled (PENDING at step 1 or REVISION at step 0)
  const canCancel = (letter: Letter) => {
    return letter.rawStatus === 'PENDING' && (letter.currentStep === 1 || letter.currentStep === 0);
  };

  // Filter letters based on search and status
  const filteredLetters = letters.filter((letter) => {
    // Filter by search query
    const matchesSearch =
      searchQuery === '' ||
      letter.agenda.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.perihal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.tujuan.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by status
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'pending' && letter.status === 'Menunggu Verifikasi') ||
      (selectedStatus === 'process' && letter.status === 'Dalam Proses') ||
      (selectedStatus === 'completed' && letter.status === 'Selesai') ||
      (selectedStatus === 'rejected' && letter.status === 'Ditolak');

    // Filter by date range
    const matchesDateRange =
      (startDate === '' && endDate === '') ||
      (startDate === '' && endDate !== '' && letter.tanggalISO <= endDate) ||
      (startDate !== '' && endDate === '' && letter.tanggalISO >= startDate) ||
      (startDate !== '' && endDate !== '' && letter.tanggalISO >= startDate && letter.tanggalISO <= endDate);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedStatus, startDate, endDate]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredLetters.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedLetters = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLetters.slice(start, start + pageSize);
  }, [filteredLetters, safePage, pageSize]);

  // Page size options
  const pageSizeOptions = [5, 10, 25, 50, 100];

  return (
    <>
      <div className='min-h-screen flex flex-col dark:bg-gray-900 transition-colors duration-300'>
        <TopBar role='Mahasiswa' onMenuClick={() => setSidebarOpen(true)} />

        <div className='flex flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300'>
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 top-14 sm:top-16 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar spacer */}
          <div className="w-0 lg:w-[280px] flex-shrink-0 overflow-hidden transition-all duration-300" />

          {/* Sidebar */}
          <aside className={`
          fixed inset-y-0 left-0
          w-[280px] bg-white dark:bg-gray-800 flex flex-col text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          z-50 lg:z-40
          top-14 sm:top-16
          h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)]
          overflow-y-auto
        `}>
            <div className='p-4 space-y-2'>
              {/* Mobile close button */}
              <div className="lg:hidden flex items-center justify-between mb-4 pb-2 border-b dark:border-gray-700">
                <span className="font-semibold dark:text-white">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dasbor */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === 'dasbor' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                onClick={() => {
                  setActiveMenu('dasbor');
                  setSidebarOpen(false);
                  router.push('/mahasiswa/dashboard-mahasiswa');
                }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className='font-medium'>Dasbor</span>
              </div>

              {/* Surat Saya */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === 'surat-saya' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                onClick={() => {
                  setActiveMenu('surat-saya');
                  setSidebarOpen(false);
                  router.push('/mahasiswa/surat-saya');
                }}
              >
                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                </svg>
                <span className='font-medium'>Surat Saya</span>
              </div>

              {/* Profil */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === 'profil' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                onClick={() => {
                  setActiveMenu('profil');
                  setSidebarOpen(false);
                  router.push('/mahasiswa/profile');
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className='font-medium'>Profil</span>
              </div>



            </div>

            {/* Logout Button */}
            <div className='mt-auto p-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin keluar?')) {
                    router.push('/auth');
                  }
                }}
                className='flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                </svg>
                <span className='font-medium'>Keluar</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className='flex-1 p-4 sm:p-6 lg:p-8 pb-24 w-full min-w-0'>
            <div className='max-w-7xl mx-auto'>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push("/mahasiswa/dashboard-mahasiswa")}>
                  Dasbor
                </span>
                <span className="mx-2">/</span>
                <span className="text-gray-800 dark:text-white font-medium">Surat Saya</span>
              </div>
              {/* Header */}
              <div className='mb-6 lg:mb-8'>
                <h1 className='text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-2'>
                  Surat Saya
                </h1>
                <p className='text-gray-600 dark:text-gray-400 text-sm lg:text-base'>
                  Pusat kendali untuk mengelola semua surat Fakultas Sains dan Matematika.
                </p>
              </div>

              {/* Section Title & Filters */}
              <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-300'>
                <h2 className='text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4'>
                  Semua Surat
                </h2>

                {/* Filters Bar - Stack on mobile, row on desktop */}
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6'>
                  {/* Search */}
                  <div className='flex-1 relative'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Cari surat...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-colors duration-300'
                    />
                  </div>

                  {/* Date Range Filter - hidden on mobile, shown with icon only on small screens */}
                  <div className='relative hidden sm:block'>
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className='flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'
                    >
                      <Calendar className='w-5 h-5 text-gray-600 dark:text-gray-400' />
                      <span className='text-gray-700 dark:text-gray-300 hidden md:inline'>
                        {startDate || endDate ? 'Tanggal Dipilih' : 'Rentang Tanggal'}
                      </span>
                    </button>

                    {/* Date Picker Dropdown */}
                    {showDatePicker && (
                      <div className='absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-10 min-w-[300px] transition-colors duration-300'>
                        <div className='space-y-3'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                              Dari Tanggal
                            </label>
                            <input
                              type='date'
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-colors duration-300'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                              Sampai Tanggal
                            </label>
                            <input
                              type='date'
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-colors duration-300'
                            />
                          </div>
                          <div className='flex gap-2'>
                            <button
                              onClick={() => {
                                setStartDate('');
                                setEndDate('');
                              }}
                              className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm'
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => setShowDatePicker(false)}
                              className='flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm'
                            >
                              Terapkan
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Filter */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className='px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none cursor-pointer transition-colors duration-300'
                  >
                    <option value='all'>Status</option>
                    <option value='pending'>Menunggu Verifikasi</option>
                    <option value='process'>Dalam Proses</option>
                    <option value='completed'>Selesai</option>
                    <option value='rejected'>Ditolak</option>
                  </select>
                </div>

                {/* Mobile Card View */}
                <div className='md:hidden space-y-3'>
                  {isLoading ? (
                    <div className='py-8 text-center text-gray-500 dark:text-gray-400'>
                      <div className='flex items-center justify-center gap-2'>
                        <Loader2 className='w-5 h-5 animate-spin' />
                        <span>Memuat data...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className='py-8 text-center text-red-500 dark:text-red-400'>{error}</div>
                  ) : filteredLetters.length === 0 ? (
                    <div className='py-8 text-center text-gray-500 dark:text-gray-400'>
                      <div className='flex flex-col items-center gap-2'>
                        <span>Tidak ada surat yang ditemukan</span>
                        <button
                          onClick={() => {
                            localStorage.removeItem('user_profile');
                            localStorage.removeItem('reached_step');
                            router.push('/surat-keterangan-aktif-kuliah/identitas-pemohon');
                          }}
                          className='mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors'
                        >
                          <Plus className='w-4 h-4' />
                          <span>Buat Surat Baru</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    pagedLetters.map((letter) => (
                      <MobileLetterCard
                        key={letter.id}
                        letter={letter}
                        onView={() => router.push(`/mahasiswa/detail-surat?id=${letter.id}`)}
                        onCancel={() => {
                          setCancellingLetterId(letter.id);
                          setShowCancelModal(true);
                        }}
                        canCancel={canCancel(letter)}
                      />
                    ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className='hidden md:block overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-gray-200 dark:border-gray-700'>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          NO/AGENDA
                        </th>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          PERIHAL
                        </th>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          TANGGAL PENGAJUAN
                        </th>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          TUJUAN SAAT INI
                        </th>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          STATUS
                        </th>
                        <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300'>
                          AKSI
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={6} className='py-8 px-4 text-center text-gray-500 dark:text-gray-400'>
                            <div className='flex items-center justify-center gap-2'>
                              <Loader2 className='w-5 h-5 animate-spin' />
                              <span>Memuat data...</span>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={6} className='py-8 px-4 text-center text-red-500 dark:text-red-400'>
                            {error}
                          </td>
                        </tr>
                      ) : filteredLetters.length === 0 ? (
                        <tr>
                          <td colSpan={6} className='py-8 px-4 text-center text-gray-500 dark:text-gray-400'>
                            <div className='flex flex-col items-center gap-2'>
                              <span>Tidak ada surat yang ditemukan</span>
                              <button
                                onClick={() => {
                                  localStorage.removeItem('user_profile');
                                  localStorage.removeItem('reached_step');
                                  router.push('/surat-keterangan-aktif-kuliah/identitas-pemohon');
                                }}
                                className='mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors'
                              >
                                <Plus className='w-4 h-4' />
                                <span>Buat Surat Baru</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pagedLetters.map((letter) => (
                          <tr key={letter.id} className={`border-b transition-colors ${letter.needsAction ? 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/15 hover:bg-amber-100/80 dark:hover:bg-amber-900/25' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                            <td className='py-4 px-4 text-sm text-gray-700 dark:text-gray-300'>
                              {letter.agenda}
                            </td>
                            <td className='py-4 px-4 text-sm text-gray-700 dark:text-gray-300'>
                              {letter.perihal}
                            </td>
                            <td className='py-4 px-4 text-sm text-gray-700 dark:text-gray-300'>
                              {letter.tanggal}
                            </td>
                            <td className='py-4 px-4 text-sm text-gray-700 dark:text-gray-300'>
                              {letter.tujuan}
                            </td>
                            <td className='py-4 px-4'>
                              <div className='flex items-center gap-2'>
                                <div
                                  className='w-2 h-2 rounded-full'
                                  style={{ backgroundColor: letter.statusColor }}
                                />
                                <span className='text-sm text-gray-700 dark:text-gray-300'>{letter.status}</span>
                              </div>
                            </td>
                            <td className='py-4 px-4'>
                              <div className='flex items-center gap-1'>
                                <button
                                  className='p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors'
                                  onClick={() => router.push(`/mahasiswa/detail-surat?id=${letter.id}`)}
                                  title='Lihat Detail'
                                >
                                  <Eye className='w-5 h-5 text-gray-600 dark:text-gray-400' />
                                </button>
                                {canCancel(letter) && (
                                  <button
                                    className='p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
                                    onClick={() => {
                                      setCancellingLetterId(letter.id);
                                      setShowCancelModal(true);
                                    }}
                                    title='Batalkan Pengajuan'
                                  >
                                    <Trash2 className='w-5 h-5 text-red-500 dark:text-red-400' />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className='flex flex-col sm:flex-row items-center justify-between mt-6 gap-4'>
                  <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
                    <span>
                      Showing <span className='font-semibold'>{filteredLetters.length > 0 ? (safePage - 1) * pageSize + 1 : 0}-{Math.min(safePage * pageSize, filteredLetters.length)}</span> of <span className='font-semibold'>{filteredLetters.length}</span>
                    </span>
                    <div className='flex items-center gap-2'>
                      <label className='text-sm text-gray-600 dark:text-gray-400'>Show:</label>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                        className='px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none cursor-pointer transition-colors duration-300'
                      >
                        {pageSizeOptions.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === safePage;
                      return (
                        <button
                          key={pageNum}
                          className={`px-3 py-1 rounded-lg transition-colors ${isActive ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl p-8 transition-colors duration-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Batalkan Pengajuan</h2>

              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Agenda</span>
                    <span className="text-base text-gray-900 dark:text-white block font-medium">
                      {letters.find(l => l.id === cancellingLetterId)?.agenda || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Jenis Surat</span>
                    <span className="text-base text-gray-900 dark:text-white block font-medium">
                      {letters.find(l => l.id === cancellingLetterId)?.perihal || '-'}
                    </span>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
                  <p className="text-red-700 dark:text-red-300 leading-relaxed">
                    Apakah Anda yakin ingin membatalkan pengajuan surat ini? <br />
                    <span className="text-sm opacity-80">Tindakan ini tidak dapat dibatalkan dan Anda harus mengajukan ulang jika ingin membuat surat baru.</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingLetterId(null);
                  }}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={handleCancelLetter}
                  disabled={isCancelling}
                  className="px-6 py-2.5 bg-red-600 dark:bg-red-500 text-white rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCancelling ? 'Memproses...' : 'Batalkan Pengajuan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </>
  );
}
