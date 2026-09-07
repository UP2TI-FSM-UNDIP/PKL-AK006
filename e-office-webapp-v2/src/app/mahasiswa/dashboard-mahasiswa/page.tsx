'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from '@/hooks/use-app-router';
import TopBar from '@/components/layouts/TopBar';
import { CardDashboard } from '@/components/ui/carddashboard';
import CompleteProfileModal from '@/components/CompleteProfileModal';

import { letterApi, getStatusLabel, getStatusColor, getStepLabel, formatDate, getAuthToken, type LetterInstance } from '@/lib/api';
import { Plus, X, Loader2, Eye, FileText, Clock, CheckCircle2, XCircle, AlertTriangle, Send, RotateCcw, Ban } from 'lucide-react';

type TableRow = {
  id: string;
  letterId: string;
  sumber: string;
  perihal: string;
  tglLabel: string;
  tglISO: string;
  tujuan: string;
  status: string;
  statusColor: string;
  rawStatus: string;
  currentStep: number;
};

export default function DashboardMahasiswaPage() {
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dasbor');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStats, setShowStats] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mhs-dashboard-show-stats');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const pageSizeOptions = [5, 10, 25, 50, 100];

  // API data states
  const [allLetters, setAllLetters] = useState<LetterInstance[]>([]);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data user untuk CompleteProfileModal
  const [currentUser, setCurrentUser] = useState<{ id: string; roles?: string[]; mahasiswa?: object | null } | null>(null);

  // Fetch user data untuk deteksi profil belum lengkap
  useEffect(() => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`${API_BASE_URL}/me`, { headers, credentials: 'include' })
      .then((r) => r.json())
      .then((res) => {
        const data = res.data || res;
        setCurrentUser({ id: data.id, roles: data.roles, mahasiswa: data.mahasiswa ?? null });
      })
      .catch(() => {});
  }, []);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await letterApi.getMyLetters();

        if (response.success && response.data) {
          setAllLetters(response.data);

          const mappedData: TableRow[] = response.data.map((item: LetterInstance) => {
            const isRevision = item.currentStep === 0 && item.status === 'PENDING';

            return {
              id: item.letterNumber || 'Belum dinomori',
              letterId: item.id,
              sumber: 'Internal',
              perihal: item.letterType?.name || 'Surat Pernyataan Masih Kuliah',
              tglLabel: formatDate(item.createdAt),
              tglISO: item.createdAt.split('T')[0],
              tujuan: item.currentStep === 0 ? 'Mahasiswa' : getStepLabel(item.currentStep),
              status: isRevision ? 'Perlu Revisi' : getStatusLabel(item.status),
              statusColor: isRevision ? '#FB923C' : getStatusColor(item.status),
              rawStatus: item.status,
              currentStep: item.currentStep,
            };
          });

          mappedData.sort((a, b) => new Date(b.tglISO).getTime() - new Date(a.tglISO).getTime());
          setTableData(mappedData);
        } else {
          setError(response.message || 'Gagal memuat data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Gagal memuat data. Pastikan server API berjalan.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Find the active letter (not COMPLETED and not REJECTED)
  const activeLetter = useMemo(() => {
    return allLetters.find(
      (item) => item.status !== 'COMPLETED' && item.status !== 'REJECTED'
    ) || null;
  }, [allLetters]);

  // Summary stats for cards
  const stats = useMemo(() => {
    const total = tableData.length;
    const pending = tableData.filter(r => r.status !== 'Selesai' && r.status !== 'Ditolak').length;
    const completed = tableData.filter(r => r.status === 'Selesai').length;
    return { total, pending, completed };
  }, [tableData]);

  const cards = [
    {
      title: "Sedang Diproses",
      value: stats.pending,
      desc: "surat belum selesai",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M8 12h8" /></svg>
      ),
    },
    {
      title: "Selesai",
      value: stats.completed,
      desc: "surat telah selesai",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
      ),
    },
    {
      title: "Total Pengajuan",
      value: stats.total,
      desc: "total surat diajukan",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>
      ),
    },
  ];

  const handleCardClick = (filterType: string) => {
    setQuery('');
    if (filterType === 'pending') {
      setStatusFilter(statusFilter === 'pending_custom' ? 'all' : 'pending_custom');
      setDateFrom('');
      setDateTo('');
    } else if (filterType === 'completed') {
      setStatusFilter(statusFilter === 'Selesai' ? 'all' : 'Selesai');
      setDateFrom('');
      setDateTo('');
    } else {
      setStatusFilter('all');
      setDateFrom('');
      setDateTo('');
    }

    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const statusOptions = useMemo(() => {
    const unique = Array.from(new Set(tableData.map((r) => r.status)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [tableData]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return tableData.filter((row) => {
      if (statusFilter === 'pending_custom') {
        if (row.status === 'Selesai' || row.status === 'Ditolak') return false;
      } else if (statusFilter !== 'all' && row.status !== statusFilter) return false;

      const rowDate = new Date(`${row.tglISO}T12:00:00`);
      if (from && rowDate < from) return false;
      if (to && rowDate > to) return false;

      if (!q) return true;
      const haystack = [row.id, row.sumber, row.perihal, row.tujuan, row.status, row.tglLabel]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [query, dateFrom, dateTo, statusFilter, tableData]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [query, dateFrom, dateTo, statusFilter]);

  // Check if any letter is still in process (not Selesai and not Ditolak)
  const hasInProgressLetter = useMemo(() => {
    return tableData.some(
      (item) => item.status !== 'Selesai' && item.status !== 'Ditolak'
    );
  }, [tableData]);

  const handleNewApplication = () => {
    if (hasInProgressLetter) {
      setShowBlockedModal(true);
      return;
    }
    localStorage.removeItem('user_profile');
    localStorage.removeItem('reached_step');
    router.push('/surat-keterangan-aktif-kuliah/identitas-pemohon');
  };

  // Stepper steps definition
  const steps = [
    { step: 0, label: 'Pengajuan', shortLabel: 'Mahasiswa' },
    { step: 1, label: 'Verifikasi SA', shortLabel: 'Sup. Akademik' },
    { step: 2, label: 'Tanda Tangan', shortLabel: 'Manajer TU' },
    { step: 3, label: 'Finalisasi', shortLabel: 'UPA' },
  ];

  const getStepStatus = (stepIndex: number, letter: LetterInstance) => {
    if (letter.status === 'REJECTED') return stepIndex <= letter.currentStep ? 'rejected' : 'future';
    if (letter.status === 'COMPLETED') return 'completed';
    if (letter.status === 'REVISION' && stepIndex === 0) return 'revision';
    if (stepIndex < letter.currentStep) return 'completed';
    if (stepIndex === letter.currentStep) {
      if (letter.status === 'REVISION') return 'revision';
      return 'current';
    }
    return 'future';
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900 transition-colors duration-300">
      {/* Modal kelengkapan profil — muncul otomatis jika mahasiswa SSO belum isi data */}
      {currentUser && (
        <CompleteProfileModal
          user={currentUser}
          onCompleted={() => {
            // Reload user data agar modal tidak muncul lagi
            const token = getAuthToken();
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            fetch(`${API_BASE_URL}/me`, { headers, credentials: 'include' })
              .then((r) => r.json())
              .then((res) => {
                const data = res.data || res;
                setCurrentUser({ id: data.id, roles: data.roles, mahasiswa: data.mahasiswa ?? null });
              })
              .catch(() => {});
          }}
        />
      )}
      <TopBar role="Mahasiswa" onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Sidebar spacer */}
        <div className="w-0 lg:w-[280px] flex-shrink-0 overflow-hidden transition-all duration-300" />
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-14 sm:top-16 bg-black/50 z-[55] lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed left-0 top-14 sm:top-16
          w-[280px] h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)]
          bg-white dark:bg-gray-800 
          flex flex-col 
          text-gray-700 dark:text-gray-200 
          border-r border-gray-200 dark:border-gray-700 
          overflow-y-auto 
          z-[60] lg:z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 space-y-2">
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
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === 'dasbor'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              onClick={() => {
                setSidebarOpen(false);
                setActiveMenu('dasbor');
                router.push('/mahasiswa/dashboard-mahasiswa');
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="font-medium">Dasbor</span>
            </div>

            {/* Surat Saya */}
            <div
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === 'surat-saya'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              onClick={() => {
                setSidebarOpen(false);
                setActiveMenu('surat-saya');
                router.push('/mahasiswa/surat-saya');
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span className="font-medium">Surat Saya</span>
            </div>

            {/* Profil */}
            <div
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === 'profil'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              onClick={() => {
                setSidebarOpen(false);
                setActiveMenu('profil');
                router.push('/mahasiswa/profile');
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="font-medium">Profil</span>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin keluar?')) {
                  router.push('/auth');
                }
              }}
              className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="font-medium">Keluar</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-24 pt-6 sm:pt-8 pb-8">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push("/")}>
              Home
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-800 dark:text-white font-medium">Dasbor</span>
          </div>
          {/* Header with Button */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1 text-gray-900 dark:text-white">Dashboard Mahasiswa</h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                Pantau status pengajuan surat dan riwayat surat akademik Anda.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const next = !showStats;
                  setShowStats(next);
                  localStorage.setItem('mhs-dashboard-show-stats', String(next));
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
                title={showStats ? 'Sembunyikan Statistik' : 'Tampilkan Statistik'}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {showStats ? (
                    <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                  ) : (
                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                  )}
                </svg>
                <span className="hidden sm:inline">{showStats ? 'Tutup Dashboard' : 'Lihat Dashboard'}</span>
              </button>
              <button
                onClick={handleNewApplication}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Buat Pengajuan Baru
              </button>
            </div>
          </div>

          {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <CardDashboard
                key={cards[0].title}
                title={cards[0].title}
                value={cards[0].value}
                desc={cards[0].desc}
                icon={cards[0].icon}
                onClick={() => handleCardClick('pending')}
                isActive={statusFilter === 'pending_custom'}
                color="orange"
              />
              <CardDashboard
                key={cards[1].title}
                title={cards[1].title}
                value={cards[1].value}
                desc={cards[1].desc}
                icon={cards[1].icon}
                onClick={() => handleCardClick('completed')}
                isActive={statusFilter === 'Selesai'}
                color="green"
              />
              <CardDashboard
                key={cards[2].title}
                title={cards[2].title}
                value={cards[2].value}
                desc={cards[2].desc}
                icon={cards[2].icon}
                onClick={() => handleCardClick('all')}
                isActive={statusFilter === 'all'}
                color="blue"
              />
            </div>
          )}

          {/* ===== SECTION 1: Tracking Status Surat ===== */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sm:p-7 mb-6 sm:mb-8 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Tracking Status Surat</h2>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memuat data...</span>
                </div>
              </div>
            ) : error ? (
              <div className="py-10 text-center text-red-500 dark:text-red-400">{error}</div>
            ) : activeLetter ? (
              <div>
                {/* Letter Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                        {activeLetter.letterType?.name || 'Surat Pernyataan Masih Kuliah'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Diajukan {formatDate(activeLetter.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${getStatusColor(activeLetter.status)}18`,
                        color: getStatusColor(activeLetter.status),
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(activeLetter.status) }} />
                      {activeLetter.currentStep === 0 && activeLetter.status === 'PENDING'
                        ? 'Perlu Revisi'
                        : getStatusLabel(activeLetter.status)}
                    </span>
                    <button
                      onClick={() => router.push(`/mahasiswa/detail-surat?id=${activeLetter.id}`)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                    >
                      Lihat Detail →
                    </button>
                  </div>
                </div>

                {/* Visual Stepper */}
                <div className="relative">
                  {/* Desktop Stepper */}
                  <div className="hidden sm:flex items-start justify-between">
                    {steps.map((s, i) => {
                      const stepStatus = getStepStatus(i, activeLetter);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center relative">
                          {/* Connector line */}
                          {i < steps.length - 1 && (
                            <div
                              className="absolute top-5 left-1/2 w-full h-0.5 z-0"
                              style={{
                                backgroundColor:
                                  stepStatus === 'completed' ? '#4ADE80'
                                    : stepStatus === 'rejected' ? '#FF5A5A'
                                      : '#E5E7EB',
                              }}
                            />
                          )}
                          {/* Step Circle */}
                          <div
                            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${stepStatus === 'completed'
                              ? 'bg-green-500 border-green-500 text-white'
                              : stepStatus === 'current'
                                ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                                : stepStatus === 'revision'
                                  ? 'bg-orange-500 border-orange-500 text-white animate-pulse'
                                  : stepStatus === 'rejected'
                                    ? 'bg-red-500 border-red-500 text-white'
                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                              }`}
                          >
                            {stepStatus === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : stepStatus === 'rejected' ? (
                              <XCircle className="w-5 h-5" />
                            ) : stepStatus === 'revision' ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : stepStatus === 'current' ? (
                              <span className="text-sm font-bold">{i + 1}</span>
                            ) : (
                              <span className="text-sm font-medium">{i + 1}</span>
                            )}
                          </div>
                          {/* Label */}
                          <p className={`mt-2 text-xs font-semibold text-center ${stepStatus === 'completed'
                            ? 'text-green-600 dark:text-green-400'
                            : stepStatus === 'current'
                              ? 'text-blue-600 dark:text-blue-400'
                              : stepStatus === 'revision'
                                ? 'text-orange-600 dark:text-orange-400'
                                : stepStatus === 'rejected'
                                  ? 'text-red-500 dark:text-red-400'
                                  : 'text-gray-400 dark:text-gray-500'
                            }`}>
                            {s.label}
                          </p>
                          <p className={`text-[10px] text-center ${stepStatus === 'future' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                            {s.shortLabel}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Stepper (vertical) */}
                  <div className="sm:hidden space-y-0">
                    {steps.map((s, i) => {
                      const stepStatus = getStepStatus(i, activeLetter);
                      return (
                        <div key={i} className="flex items-start gap-3">
                          {/* Left: circle + connector */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all duration-500 ${stepStatus === 'completed'
                                ? 'bg-green-500 border-green-500 text-white'
                                : stepStatus === 'current'
                                  ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                                  : stepStatus === 'revision'
                                    ? 'bg-orange-500 border-orange-500 text-white animate-pulse'
                                    : stepStatus === 'rejected'
                                      ? 'bg-red-500 border-red-500 text-white'
                                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                                }`}
                            >
                              {stepStatus === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : stepStatus === 'rejected' ? (
                                <XCircle className="w-4 h-4" />
                              ) : stepStatus === 'revision' ? (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              ) : (
                                <span className="text-xs font-bold">{i + 1}</span>
                              )}
                            </div>
                            {i < steps.length - 1 && (
                              <div
                                className="w-0.5 h-6"
                                style={{
                                  backgroundColor:
                                    stepStatus === 'completed' ? '#4ADE80'
                                      : stepStatus === 'rejected' ? '#FF5A5A'
                                        : '#E5E7EB',
                                }}
                              />
                            )}
                          </div>
                          {/* Right: label */}
                          <div className="pt-1.5 pb-3">
                            <p className={`text-sm font-semibold ${stepStatus === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : stepStatus === 'current'
                                ? 'text-blue-600 dark:text-blue-400'
                                : stepStatus === 'revision'
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : stepStatus === 'rejected'
                                    ? 'text-red-500'
                                    : 'text-gray-400 dark:text-gray-500'
                              }`}>
                              {s.label}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{s.shortLabel}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State — no active letter */
              <div className="py-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Tidak ada surat aktif</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Anda belum memiliki surat yang sedang dalam proses pengajuan.</p>
                <button
                  onClick={handleNewApplication}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Buat Pengajuan Baru
                </button>
              </div>
            )}
          </div>

          {/* ===== SECTION 2: Semua Surat ===== */}
          <div
            ref={tableRef}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 gap-3">
              <span className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">Semua Surat</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 sm:py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-colors"
                  placeholder="Cari surat..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="hidden sm:flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-gray-50 dark:bg-gray-700 transition-colors">
                  <span className="text-gray-500 dark:text-gray-400">Rentang</span>
                  <input
                    type="date"
                    className="bg-transparent outline-none text-gray-900 dark:text-gray-100"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                  <input
                    type="date"
                    className="bg-transparent outline-none text-gray-900 dark:text-gray-100"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <select
                  className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 sm:py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-colors"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memuat data...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="py-8 text-center text-red-500 dark:text-red-400">{error}</div>
              ) : pagedRows.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Tidak ada surat yang ditemukan
                </div>
              ) : (
                pagedRows.map((row) => (
                  <div
                    key={row.letterId}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.id}</span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${row.statusColor}18`,
                          color: row.statusColor,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.statusColor }} />
                        {row.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{row.perihal}</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <span>Sumber: <span className="text-gray-900 dark:text-gray-200">{row.sumber}</span></span>
                      <span>Tanggal: <span className="text-gray-900 dark:text-gray-200">{row.tglLabel}</span></span>
                      <span>Tujuan: <span className="text-gray-900 dark:text-gray-200">{row.tujuan}</span></span>
                    </div>
                    <button
                      onClick={() => router.push(`/mahasiswa/detail-surat?id=${row.letterId}`)}
                      className="w-full mt-2 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      Lihat Detail
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 px-2">ID/AGENDA</th>
                    <th className="py-2 px-2">SUMBER</th>
                    <th className="py-2 px-2">PERIHAL</th>
                    <th className="py-2 px-2">TANGGAL PENGAJUAN</th>
                    <th className="py-2 px-2">TUJUAN SAAT INI</th>
                    <th className="py-2 px-2">STATUS</th>
                    <th className="py-2 px-2">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-red-500 dark:text-red-400">
                        {error}
                      </td>
                    </tr>
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada surat yang ditemukan
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((row) => (
                      <tr
                        key={row.letterId}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-2 px-2 font-mono text-gray-900 dark:text-gray-100">{row.id}</td>
                        <td className="py-2 px-2"><span className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs">{row.sumber}</span></td>
                        <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.perihal}</td>
                        <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.tglLabel}</td>
                        <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.tujuan}</td>
                        <td className="py-2 px-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                            style={{
                              backgroundColor: `${row.statusColor}18`,
                              color: row.statusColor,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.statusColor }} />
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <button
                            className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                            title="Lihat Detail"
                            onClick={() => router.push(`/mahasiswa/detail-surat?id=${row.letterId}`)}
                          >
                            <svg width="20" height="20" fill="none" stroke="currentColor" className="text-gray-600 dark:text-gray-400" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="flex flex-col sm:flex-row justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400 gap-4">
                <div className="flex items-center gap-4">
                  <span>
                    Showing {filteredRows.length > 0 ? (safePage - 1) * pageSize + 1 : 0}-{Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Show:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent outline-none cursor-pointer transition-colors"
                    >
                      {pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-1 items-center">
                  <button
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === safePage;
                    return (
                      <button
                        key={pageNum}
                        className={`border border-gray-300 dark:border-gray-600 rounded px-2 py-1 transition-colors ${isActive
                          ? 'bg-blue-600 dark:bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Pagination */}
            <div className="md:hidden flex flex-col sm:flex-row justify-between items-center mt-4 text-xs text-gray-500 dark:text-gray-400 gap-3">
              <div className="flex items-center gap-4">
                <span>
                  Showing {filteredRows.length > 0 ? (safePage - 1) * pageSize + 1 : 0}-{Math.min(safePage * pageSize, filteredRows.length)} of{' '}
                  {filteredRows.length}
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Show:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent outline-none cursor-pointer transition-colors"
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-1 items-center">
                <button
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  &lt;
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === safePage;
                  return (
                    <button
                      key={pageNum}
                      className={`border border-gray-300 dark:border-gray-600 rounded px-2 py-1 transition-colors ${isActive
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal: Surat masih dalam proses */}
      {showBlockedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowBlockedModal(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-[90%] mx-4 transform animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            {/* Title */}
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
              Tidak Dapat Mengajukan Surat Baru
            </h3>
            {/* Message */}
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
              Anda masih memiliki surat yang sedang dalam proses. Harap tunggu hingga surat tersebut <span className="font-semibold text-green-600 dark:text-green-400">selesai</span> atau <span className="font-semibold text-red-500 dark:text-red-400">ditolak</span> sebelum mengajukan surat baru.
            </p>
            {/* Button */}
            <button
              onClick={() => setShowBlockedModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
