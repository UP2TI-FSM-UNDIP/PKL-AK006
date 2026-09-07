"use client";

import React, {
  useState, useEffect, useRef
} from "react";
import { useRouter } from '@/hooks/use-app-router';
import { API_BASE_URL } from '@/lib/api';
import TopBar from "@/components/layouts/TopBar";
import { SuperadminSidebar } from "@/components/layouts/SuperadminSidebar";
import { CardDashboard } from "@/components/ui/carddashboard";
import {
  superadminApi,
  letterApi,
  type SuperadminStats,
  type LetterInstance,
  getStatusLabel,
  getStatusColor,
  getStepLabel,
  formatDate,
} from "@/lib/api";
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  Loader2,
} from "lucide-react";

type TableRow = {
  id: string;
  letterId: string;
  sumber: string;
  pengirim: string;
  perihal: string;
  tglLabel: string;
  tglISO: string;
  tujuan: string;
  status: string;
  statusColor: string;
  role: string;
};

export default function SuperadminDashboardPage() {
  const router = useRouter();
  const tableRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SuperadminStats | null>(null);
  const [recentLetters, setRecentLetters] = useState<TableRow[]>([]);
  const [showStats, setShowStats] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('superadmin-dashboard-show-stats');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Filters and pagination
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Check auth and load data
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user has superadmin role
        const profileRes = await fetch(`${API_BASE_URL}/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!profileRes.ok) {
          router.push("/auth");
          return;
        }

        const profileData = await profileRes.json();
        const userData = profileData.data || profileData;
        const roles = userData.roles as string[] | undefined;

        const isSuperadmin = roles?.some(
          (role: string) => role.toLowerCase() === "superadmin"
        );

        if (!isSuperadmin) {
          router.push("/auth");
          return;
        }

        // Load dashboard stats
        const statsRes = await superadminApi.getStats();
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }

        // Load recent letters
        await loadLetters();
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError("Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, []); // Only run once on mount

  // Load letters with filters
  const loadLetters = async () => {
    try {
      const params: any = {
        page,
        limit: pageSize,
      };

      if (statusFilter !== "all") params.status = statusFilter;
      if (roleFilter !== "all") params.role = roleFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (query) params.search = query;

      const res = await superadminApi.getAllLetters(params);
      if (res.success && res.data) {
        const mapped: TableRow[] = res.data.map((item: LetterInstance) => ({
          id: item.letterNumber || 'Belum dinomori',
          letterId: item.id,
          sumber: "Internal",
          pengirim: item.createdBy?.name || "Unknown",
          perihal: item.letterType?.name || "Surat",
          tglLabel: formatDate(item.createdAt),
          tglISO: item.createdAt.split("T")[0],
          tujuan: getStepLabel(item.currentStep),
          status: getStatusLabel(item.status),
          statusColor: getStatusColor(item.status),
          role: getStepLabel(item.currentStep),
        }));
        setRecentLetters(mapped);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Error loading letters:", err);
    }
  };

  // Reload when filters change
  useEffect(() => {
    if (!loading) {
      loadLetters();
    }
  }, [page, pageSize, statusFilter, roleFilter, dateFrom, dateTo, query]);

  const dashboardCards = [
    {
      title: "Total Surat",
      value: stats?.letters.total || 0,
      desc: "seluruh surat dalam sistem",
      icon: <FileText className="w-6 h-6" />,
      color: "text-blue-500",
      filterKey: "all",
    },
    {
      title: "Menunggu Proses",
      value: stats?.letters.pending || 0,
      desc: "surat belum diproses",
      icon: <Clock className="w-6 h-6" />,
      color: "text-yellow-500",
      filterKey: "PENDING",
    },
    {
      title: "Selesai",
      value: stats?.letters.completed || 0,
      desc: "surat telah selesai",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "text-green-500",
      filterKey: "COMPLETED",
    },
    {
      title: "Ditolak",
      value: stats?.letters.rejected || 0,
      desc: "surat ditolak",
      icon: <XCircle className="w-6 h-6" />,
      color: "text-red-500",
      filterKey: "REJECTED",
    },
  ];

  const userCards = [
    {
      title: "Total Pengguna",
      value: stats?.users.total || 0,
      desc: "akun terdaftar",
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: "Mahasiswa",
      value: stats?.users.mahasiswa || 0,
      desc: "mahasiswa aktif",
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: "Pegawai",
      value: stats?.users.pegawai || 0,
      desc: "pegawai/staff",
      icon: <Users className="w-6 h-6" />,
    },
  ];

  const stepDistribution = [
    { label: "Mahasiswa", value: stats?.letters.byStep.mahasiswaStep || 0, color: "#3B82F6" },
    { label: "Supervisor", value: stats?.letters.byStep.saStep || 0, color: "#F59E0B" },
    { label: "MTU", value: stats?.letters.byStep.mtuStep || 0, color: "#8B5CF6" },
    { label: "UPA", value: stats?.letters.byStep.upaStep || 0, color: "#10B981" },
  ];

  const handleCardClick = (filterKey: string) => {
    if (filterKey === "all") {
      setStatusFilter("all");
    } else {
      setStatusFilter(filterKey);
    }
    setPage(1);
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
            Memuat Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
      <TopBar
        role="Superadmin"
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="flex flex-1 bg-[#F3F3F3] dark:bg-gray-900 transition-colors duration-300">
        <SuperadminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 pt-8 pb-8 px-4 sm:px-8 lg:px-16 overflow-x-hidden">
          {/* Breadcrumbs */}
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            <span
              className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              onClick={() => router.push("/")}
            >
              Home
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-800 dark:text-white font-medium">Dasbor</span>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard Sistem
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Pusat kendali untuk mengelola seluruh sistem E-Office
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const next = !showStats;
                  setShowStats(next);
                  localStorage.setItem('superadmin-dashboard-show-stats', String(next));
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
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {showStats && (
            <>

              {/* Letter Statistics Cards */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Statistik Surat
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardCards.map((card) => (
                    <div
                      key={card.title}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 p-5 cursor-pointer hover:shadow-lg transition-all duration-300"
                      onClick={() => handleCardClick(card.filterKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {card.title}
                          </p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            {card.value.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {card.desc}
                          </p>
                        </div>
                        <div className={`${card.color}`}>{card.icon}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Statistics and Step Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Statistik Pengguna
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {userCards.map((card) => (
                      <div key={card.title} className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {card.value.toLocaleString("id-ID")}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {card.title}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push("/superadmin/users")}
                    className="mt-4 w-full py-2 px-4 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
                  >
                    Kelola Pengguna
                  </button>
                </div>

                {/* Step Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Distribusi Surat per Tahap
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {stepDistribution.map((item) => (
                      <div key={item.label} className="flex flex-col items-center">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.value}
                        </p>
                        <div
                          className="w-12 h-16 rounded-lg mt-2"
                          style={{
                            backgroundColor: item.color,
                            height: Math.max(item.value * 2 + 20, 40),
                          }}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 p-6 mb-8">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Statistik Bulan Ini
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats?.monthly.total || 0}
                    </p>
                    <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
                      Total Surat Bulan Ini
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {stats?.monthly.completed || 0}
                    </p>
                    <p className="text-sm text-green-600/70 dark:text-green-400/70">
                      Selesai Bulan Ini
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {stats?.monthly.pending || 0}
                    </p>
                    <p className="text-sm text-yellow-600/70 dark:text-yellow-400/70">
                      Menunggu Proses
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Letters Table */}
          <div ref={tableRef} className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                Semua Surat
              </h3>
              <div className="flex gap-2 flex-wrap">
                <input
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                  placeholder="Cari surat..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
                <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-gray-50 dark:bg-gray-700">
                  <input
                    type="date"
                    className="bg-transparent outline-none text-gray-900 dark:text-gray-100"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    className="bg-transparent outline-none text-gray-900 dark:text-gray-100"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <select
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Semua Status</option>
                  <option value="PENDING">Menunggu</option>
                  <option value="IN_PROGRESS">Dalam Proses</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="REJECTED">Ditolak</option>
                  <option value="REVISION">Revisi</option>
                </select>
                <select
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Semua Tahap</option>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="supervisor_akademik">Supervisor Akademik</option>
                  <option value="manager_tu">Manajer TU</option>
                  <option value="upa">UPA</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-2 font-medium">ID/AGENDA</th>
                    <th className="py-3 px-2 font-medium">PENGIRIM</th>
                    <th className="py-3 px-2 font-medium">PERIHAL</th>
                    <th className="py-3 px-2 font-medium">TANGGAL</th>
                    <th className="py-3 px-2 font-medium">TAHAP</th>
                    <th className="py-3 px-2 font-medium">STATUS</th>
                    <th className="py-3 px-2 font-medium">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLetters.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        Tidak ada surat yang ditemukan
                      </td>
                    </tr>
                  ) : (
                    recentLetters.map((row) => (
                      <tr
                        key={row.letterId}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 px-2 font-mono text-gray-900 dark:text-gray-100">
                          {row.id}
                        </td>
                        <td className="py-3 px-2 text-gray-900 dark:text-gray-100">
                          {row.pengirim}
                        </td>
                        <td className="py-3 px-2 text-gray-900 dark:text-gray-100">
                          {row.perihal}
                        </td>
                        <td className="py-3 px-2 text-gray-900 dark:text-gray-100">
                          {row.tglLabel}
                        </td>
                        <td className="py-3 px-2 text-gray-900 dark:text-gray-100">
                          <span className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-xs">
                            {row.tujuan}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: row.statusColor }}
                            />
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <button
                            className="hover:bg-purple-100 dark:hover:bg-purple-900/30 p-2 rounded transition-colors"
                            title="Lihat Detail"
                            onClick={() =>
                              router.push(`/superadmin/letters/${row.letterId}`)
                            }
                          >
                            <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-500 dark:text-gray-400 gap-4">
              <div className="flex items-center gap-4">
                <span>Halaman {page} dari {totalPages}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size} per halaman
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </button>
                <button
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
