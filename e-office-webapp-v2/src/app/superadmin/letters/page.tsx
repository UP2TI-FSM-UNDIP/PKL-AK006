"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from '@/hooks/use-app-router';
import TopBar from "@/components/layouts/TopBar";
import { SuperadminSidebar } from "@/components/layouts/SuperadminSidebar";
import {
  superadminApi,
  type LetterInstance,
  getStatusLabel,
  getStatusColor,
  getStepLabel,
  formatDate,
} from "@/lib/api";
import {
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Download,
  MoreVertical,
} from "lucide-react";

type TableRow = {
  id: string;
  letterId: string;
  pengirim: string;
  email: string;
  perihal: string;
  tglLabel: string;
  tglISO: string;
  tujuan: string;
  status: string;
  statusColor: string;
  statusRaw: string;
  currentStep: number;
  needsAction: boolean;
};

export default function SuperadminLettersPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<TableRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters and pagination
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<TableRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveComment, setApproveComment] = useState("");

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const profileRes = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
      if (!profileRes.ok) {
        router.push("/auth");
        return;
      }
      const data = await profileRes.json();
      const roles = data.data?.roles || data.roles || [];
      if (!roles.some((r: string) => r.toLowerCase() === "superadmin")) {
        router.push("/auth");
      }
    };
    checkAuth();
  }, [router]);

  // Load letters
  const loadLetters = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { page, limit: pageSize };
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
          pengirim: item.createdBy?.name || "Unknown",
          email: item.createdBy?.email || "",
          perihal: item.letterType?.name || "Surat",
          tglLabel: formatDate(item.createdAt),
          tglISO: item.createdAt.split("T")[0],
          tujuan: getStepLabel(item.currentStep),
          status: getStatusLabel(item.status),
          statusColor: getStatusColor(item.status),
          statusRaw: item.status,
          currentStep: item.currentStep,
          needsAction: item.status === 'PENDING',
        }));
        setLetters(mapped);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error loading letters:", err);
      setError("Gagal memuat data surat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLetters();
  }, [page, pageSize, statusFilter, roleFilter, dateFrom, dateTo]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadLetters();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle delete
  const handleDelete = async () => {
    if (!selectedLetter) return;
    try {
      setActionLoading(selectedLetter.letterId);
      const res = await superadminApi.deleteLetter(selectedLetter.letterId);
      if (res.success) {
        setLetters((prev) => prev.filter((l) => l.letterId !== selectedLetter.letterId));
        setShowDeleteModal(false);
        setSelectedLetter(null);
      } else {
        console.error(res.message || "Gagal menghapus surat");
      }
    } catch (err) {
      console.error("Error deleting letter:", err);
      console.error("Gagal menghapus surat");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle force approve
  const handleForceApprove = async () => {
    if (!selectedLetter) return;
    try {
      setActionLoading(selectedLetter.letterId);
      const res = await superadminApi.forceApproveLetter(selectedLetter.letterId, {
        comments: approveComment || "Force approved by Superadmin",
      });
      if (res.success) {
        await loadLetters();
        setShowApproveModal(false);
        setSelectedLetter(null);
        setApproveComment("");
      } else {
        console.error(res.message || "Gagal menyetujui surat");
      }
    } catch (err) {
      console.error("Error approving letter:", err);
      console.error("Gagal menyetujui surat");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle force reject
  const handleForceReject = async () => {
    if (!selectedLetter || !rejectReason.trim()) return;
    try {
      setActionLoading(selectedLetter.letterId);
      const res = await superadminApi.forceRejectLetter(
        selectedLetter.letterId,
        rejectReason
      );
      if (res.success) {
        await loadLetters();
        setShowRejectModal(false);
        setSelectedLetter(null);
        setRejectReason("");
      } else {
        console.error(res.message || "Gagal menolak surat");
      }
    } catch (err) {
      console.error("Error rejecting letter:", err);
      console.error("Gagal menolak surat");
    } finally {
      setActionLoading(null);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setRoleFilter("all");
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <TopBar role="Superadmin" onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex flex-1 bg-[#F3F3F3] dark:bg-gray-900">
        <SuperadminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 pt-8 pb-8 px-4 sm:px-8 lg:px-16 overflow-x-hidden">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            <span
              className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              onClick={() => router.push("/superadmin/dashboard")}
            >
              Dasbor
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-800 dark:text-white font-medium">
              Semua Surat
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manajemen Surat
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola semua surat dalam sistem dengan akses penuh
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <button
                onClick={loadLetters}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 p-4 mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Cari surat, pengirim, atau nomor..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
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
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Semua Tahap</option>
                <option value="mahasiswa">Mahasiswa</option>
                <option value="supervisor_akademik">Supervisor</option>
                <option value="manager_tu">MTU</option>
                <option value="upa">UPA</option>
              </select>

              <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <input
                  type="date"
                  className="bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  className="bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <button
                onClick={resetFilters}
                className="px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total: {totalItems} surat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-3 px-4 font-medium">ID/AGENDA</th>
                    <th className="py-3 px-4 font-medium">PENGIRIM</th>
                    <th className="py-3 px-4 font-medium">PERIHAL</th>
                    <th className="py-3 px-4 font-medium">TANGGAL</th>
                    <th className="py-3 px-4 font-medium">TAHAP</th>
                    <th className="py-3 px-4 font-medium">STATUS</th>
                    <th className="py-3 px-4 font-medium text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                          Memuat data...
                        </p>
                      </td>
                    </tr>
                  ) : letters.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada surat yang ditemukan
                      </td>
                    </tr>
                  ) : (
                    letters.map((row) => (
                      <tr
                        key={row.letterId}
                        className={`border-b transition-colors ${row.needsAction ? 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/15 hover:bg-amber-100/80 dark:hover:bg-amber-900/25' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                      >
                        <td className="py-3 px-4 font-mono text-gray-900 dark:text-gray-100">
                          {row.id}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-gray-900 dark:text-gray-100">
                              {row.pengirim}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {row.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {row.perihal}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {row.tglLabel}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-gray-100">
                            {row.tujuan}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: row.statusColor }}
                            />
                            <span className="text-gray-900 dark:text-gray-100">
                              {row.status}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1 relative">
                            <button
                              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                              title="Lihat Detail"
                              onClick={() => router.push(`/superadmin/letters/${row.letterId}`)}
                            >
                              <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </button>

                            {/* More actions dropdown */}
                            <div className="relative" ref={(el) => {
                              if (el && actionMenuOpen === row.letterId) {
                                const rect = el.getBoundingClientRect();
                                const menuEl = el.querySelector('[data-action-menu]') as HTMLElement;
                                if (menuEl) {
                                  const menuHeight = menuEl.offsetHeight || 180;
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  if (spaceBelow < menuHeight) {
                                    menuEl.style.top = 'auto';
                                    menuEl.style.bottom = `${window.innerHeight - rect.top + 4}px`;
                                  } else {
                                    menuEl.style.top = `${rect.bottom + 4}px`;
                                    menuEl.style.bottom = 'auto';
                                  }
                                  menuEl.style.right = `${window.innerWidth - rect.right}px`;
                                }
                              }
                            }}>
                              <button
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                onClick={() =>
                                  setActionMenuOpen(
                                    actionMenuOpen === row.letterId ? null : row.letterId
                                  )
                                }
                              >
                                <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>

                              {actionMenuOpen === row.letterId && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setActionMenuOpen(null)}
                                  />
                                  <div data-action-menu className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                                    {row.statusRaw !== "COMPLETED" &&
                                      row.statusRaw !== "REJECTED" && (
                                        <>
                                          <button
                                            className="w-full px-4 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 flex items-center gap-2"
                                            onClick={() => {
                                              setSelectedLetter(row);
                                              setShowApproveModal(true);
                                              setActionMenuOpen(null);
                                            }}
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                            Force Approve
                                          </button>
                                          <button
                                            className="w-full px-4 py-2 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 flex items-center gap-2"
                                            onClick={() => {
                                              setSelectedLetter(row);
                                              setShowRejectModal(true);
                                              setActionMenuOpen(null);
                                            }}
                                          >
                                            <XCircle className="w-4 h-4" />
                                            Force Reject
                                          </button>
                                        </>
                                      )}
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                                      onClick={() => {
                                        setSelectedLetter(row);
                                        setShowDeleteModal(true);
                                        setActionMenuOpen(null);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Hapus Surat
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Halaman {page} dari {totalPages}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </button>
                <button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
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

      {/* Delete Modal */}
      {showDeleteModal && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Konfirmasi Hapus Surat
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Apakah Anda yakin ingin menghapus surat{" "}
              <strong>{selectedLetter.id}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedLetter(null);
                }}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                onClick={handleDelete}
                disabled={actionLoading === selectedLetter.letterId}
              >
                {actionLoading === selectedLetter.letterId && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Approve Modal */}
      {showApproveModal && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Force Approve Surat
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Anda akan menyetujui surat <strong>{selectedLetter.id}</strong>{" "}
              secara langsung dan menandainya sebagai selesai.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Komentar (Opsional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Tambahkan komentar..."
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedLetter(null);
                  setApproveComment("");
                }}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                onClick={handleForceApprove}
                disabled={actionLoading === selectedLetter.letterId}
              >
                {actionLoading === selectedLetter.letterId && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Force Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Reject Modal */}
      {showRejectModal && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Force Reject Surat
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Anda akan menolak surat <strong>{selectedLetter.id}</strong> secara langsung.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Masukkan alasan penolakan..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedLetter(null);
                  setRejectReason("");
                }}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 disabled:opacity-50"
                onClick={handleForceReject}
                disabled={
                  !rejectReason.trim() ||
                  actionLoading === selectedLetter.letterId
                }
              >
                {actionLoading === selectedLetter.letterId && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Force Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
