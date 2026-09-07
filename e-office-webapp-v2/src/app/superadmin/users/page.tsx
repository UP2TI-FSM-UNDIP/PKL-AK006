"use client";

import React, { useState, useEffect, Suspense } from "react";
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/layouts/TopBar";
import { SuperadminSidebar } from "@/components/layouts/SuperadminSidebar";
import {
  superadminApi,
  type SuperadminUser,
  type RoleInfo,
} from "@/lib/api";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Shield,
  UserPlus,
  UserMinus,
  LogIn,
  Loader2,
  MoreVertical,
  Mail,
  GraduationCap,
  Briefcase,
  X,
  Check,
  Plus,
  Key,
  EyeOff,
} from "lucide-react";

function SuperadminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") || "all";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<SuperadminUser[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters and pagination
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(typeParam);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Action states
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SuperadminUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [showCreateMahasiswaModal, setShowCreateMahasiswaModal] = useState(false);
  const [showCreatePegawaiModal, setShowCreatePegawaiModal] = useState(false);
  const [showConfirmCreate, setShowConfirmCreate] = useState<"mahasiswa" | "pegawai" | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Create mahasiswa form
  const [mhsName, setMhsName] = useState("");
  const [mhsEmail, setMhsEmail] = useState("");
  const [mhsNim, setMhsNim] = useState("");
  const [mhsTahunMasuk, setMhsTahunMasuk] = useState("");
  const [mhsNoHp, setMhsNoHp] = useState("");
  const [mhsAlamat, setMhsAlamat] = useState("");
  const [mhsTempatLahir, setMhsTempatLahir] = useState("");
  const [mhsTanggalLahir, setMhsTanggalLahir] = useState("");
  const [mhsDepartemenId, setMhsDepartemenId] = useState("");
  const [mhsProgramStudiId, setMhsProgramStudiId] = useState("");
  const [mhsPassword, setMhsPassword] = useState("");
  const [mhsError, setMhsError] = useState<string | null>(null);

  // Create pegawai form
  const [pgwName, setPgwName] = useState("");
  const [pgwEmail, setPgwEmail] = useState("");
  const [pgwPassword, setPgwPassword] = useState("");
  const [pgwNip, setPgwNip] = useState("");
  const [pgwJabatan, setPgwJabatan] = useState("");
  const [pgwNoHp, setPgwNoHp] = useState("");
  const [pgwError, setPgwError] = useState<string | null>(null);

  // Jabatan options mapped to roles
  const jabatanOptions = [
    { label: "Dekan", role: "dekan" },
    { label: "Wakil Dekan 1", role: "wakil_dekan_1" },
    { label: "Wakil Dekan 2", role: "wakil_dekan_2" },
    { label: "Supervisor Akademik", role: "supervisor_akademik" },
    { label: "Supervisor Kemahasiswaan", role: "supervisor_kemahasiswaan" },
    { label: "Supervisor Sumberdaya", role: "supervisor_sumberdaya" },
    { label: "Manajer TU", role: "manager_tu" },
    { label: "Petugas TU", role: "petugas_tu" },
    { label: "Petugas Akademik", role: "petugas_akademik" },
    { label: "UPA", role: "upa" },
    { label: "Ketua Departemen", role: "ketua_departemen" },
    { label: "Ketua Prodi", role: "ketua_prodi" },
    { label: "Admin Departemen", role: "admin_departemen" },
    { label: "Dosen Koordinator", role: "dosen_koordinator" },
    { label: "Dosen Pembimbing", role: "dosen_pembimbing" },
    { label: "Pegawai UKT", role: "pegawai_ukt" },
  ];

  // Departemen & Prodi data for dropdowns
  const [departemenList, setDepartemenList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [prodiList, setProdiList] = useState<{ id: string; name: string; code: string; departemenId: string }[]>([]);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      const profileRes = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
      if (!profileRes.ok) {
        router.push("/auth");
        return;
      }
      const data = await profileRes.json();
      const userRoles = data.data?.roles || data.roles || [];
      if (!userRoles.some((r: string) => r.toLowerCase() === "superadmin")) {
        router.push("/auth");
      }
    };
    checkAuth();
  }, [router]);

  // Load users
  const loadUsers = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { page, limit: pageSize };
      if (typeFilter !== "all") params.type = typeFilter;
      if (query) params.search = query;

      const res = await superadminApi.getAllUsers(params);

      // If signal is aborted, don't update state
      if (signal?.aborted) return;

      if (res.success && res.data) {
        setUsers(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.total || 0);
      }
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Error loading users:", err);
      setError("Gagal memuat data pengguna");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  // Load roles
  const loadRoles = async () => {
    try {
      const res = await superadminApi.getAllRoles();
      if (res.success && res.data) {
        setRoles(res.data);
      }
    } catch (err) {
      console.error("Error loading roles:", err);
    }
  };

  // Load departemen & prodi for create form
  const loadDepartemen = async () => {
    try {
      const res = await superadminApi.getDepartemen();
      if (res.success && res.data) setDepartemenList(res.data);
    } catch (err) {
      console.error("Error loading departemen:", err);
    }
  };

  const loadProdi = async (deptId?: string) => {
    try {
      const res = await superadminApi.getProgramStudi(deptId);
      if (res.success && res.data) setProdiList(res.data);
    } catch (err) {
      console.error("Error loading prodi:", err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [page, pageSize, typeFilter]);

  // Debounced search
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (page === 1) {
        loadUsers(controller.signal);
      } else {
        setPage(1);
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Update type filter from URL
  useEffect(() => {
    setTypeFilter(typeParam);
    setPage(1);
  }, [typeParam]);

  // Handle create mahasiswa
  const validateMahasiswaForm = () => {
    if (!mhsName || !mhsEmail || !mhsNim || !mhsTahunMasuk || !mhsNoHp || !mhsDepartemenId || !mhsProgramStudiId) {
      setMhsError("Harap isi semua field yang wajib");
      return false;
    }
    // If password is provided, validate minimum length
    if (mhsPassword && mhsPassword.length < 8) {
      setMhsError("Password minimal 8 karakter");
      return false;
    }
    // If no password provided, NIM will be used - validate NIM length
    if (!mhsPassword && mhsNim.length < 8) {
      setMhsError("NIM harus minimal 8 karakter (digunakan sebagai password default)");
      return false;
    }
    setMhsError(null);
    return true;
  };

  const confirmCreateMahasiswa = () => {
    if (!validateMahasiswaForm()) return;
    setShowConfirmCreate("mahasiswa");
  };

  const handleCreateMahasiswa = async () => {
    try {
      setActionLoading(true);
      setMhsError(null);
      const res = await superadminApi.createMahasiswa({
        name: mhsName,
        email: mhsEmail,
        password: mhsPassword || undefined,
        nim: mhsNim,
        tahunMasuk: mhsTahunMasuk,
        noHp: mhsNoHp,
        alamat: mhsAlamat || undefined,
        tempatLahir: mhsTempatLahir || undefined,
        tanggalLahir: mhsTanggalLahir || undefined,
        departemenId: mhsDepartemenId,
        programStudiId: mhsProgramStudiId,
      });
      if (res.success) {
        setShowCreateMahasiswaModal(false);
        resetMahasiswaForm();
        loadUsers();
      } else {
        setMhsError(res.message || "Gagal menambahkan mahasiswa");
      }
    } catch (err) {
      console.error("Error creating mahasiswa:", err);
      setMhsError("Gagal menambahkan mahasiswa");
    } finally {
      setActionLoading(false);
    }
  };

  const resetMahasiswaForm = () => {
    setMhsName("");
    setMhsEmail("");
    setMhsNim("");
    setMhsTahunMasuk("");
    setMhsNoHp("");
    setMhsAlamat("");
    setMhsTempatLahir("");
    setMhsTanggalLahir("");
    setMhsDepartemenId("");
    setMhsProgramStudiId("");
    setMhsPassword("");
    setMhsError(null);
  };

  const openCreateMahasiswaModal = () => {
    resetMahasiswaForm();
    loadDepartemen();
    loadProdi();
    setShowCreateMahasiswaModal(true);
  };

  // Handle create pegawai
  const validatePegawaiForm = () => {
    if (!pgwName || !pgwEmail || !pgwNip || !pgwJabatan) {
      setPgwError("Harap isi semua field yang wajib");
      return false;
    }
    // If password is provided, validate minimum length
    if (pgwPassword && pgwPassword.length < 8) {
      setPgwError("Password minimal 8 karakter");
      return false;
    }
    // If no password provided, NIP will be used - validate NIP length
    if (!pgwPassword && pgwNip.length < 8) {
      setPgwError("NIP harus minimal 8 karakter (digunakan sebagai password default)");
      return false;
    }
    setPgwError(null);
    return true;
  };

  const confirmCreatePegawai = () => {
    if (!validatePegawaiForm()) return;
    setShowConfirmCreate("pegawai");
  };

  const handleCreatePegawai = async () => {
    try {
      setActionLoading(true);
      setPgwError(null);
      const selectedJabatan = jabatanOptions.find(j => j.role === pgwJabatan);
      const res = await superadminApi.createPegawai({
        name: pgwName,
        email: pgwEmail,
        password: pgwPassword || undefined,
        nip: pgwNip,
        jabatan: selectedJabatan?.label || pgwJabatan,
        role: pgwJabatan,
        noHp: pgwNoHp || undefined,
      });
      if (res.success) {
        setShowCreatePegawaiModal(false);
        resetPegawaiForm();
        loadUsers();
      } else {
        setPgwError(res.message || "Gagal menambahkan pegawai");
      }
    } catch (err) {
      console.error("Error creating pegawai:", err);
      setPgwError("Gagal menambahkan pegawai");
    } finally {
      setActionLoading(false);
    }
  };

  const resetPegawaiForm = () => {
    setPgwName("");
    setPgwEmail("");
    setPgwPassword("");
    setPgwNip("");
    setPgwJabatan("");
    setPgwNoHp("");
    setPgwError(null);
  };

  const openCreatePegawaiModal = () => {
    resetPegawaiForm();
    setShowCreatePegawaiModal(true);
  };

  // Handle reset password
  const handleResetUserPassword = async () => {
    if (!selectedUser) return;
    if (resetPassword.length < 8) {
      setResetPasswordError("Password minimal 8 karakter");
      return;
    }

    try {
      setActionLoading(true);
      const res = await superadminApi.resetUserPassword(selectedUser.id, resetPassword);
      if (res.success) {
        setShowResetPasswordModal(false);
        setResetPassword("");
        setSelectedUser(null);
        setResetPasswordError(null);
        // alert("Password berhasil direset");
      } else {
        setResetPasswordError(res.message || "Gagal mereset password");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      setResetPasswordError("Gagal mereset password");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await superadminApi.deleteUser(selectedUser.id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        setError(res.message || "Gagal menghapus pengguna");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      console.error("Gagal menghapus pengguna");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await superadminApi.updateUser(selectedUser.id, {
        name: editName,
        email: editEmail,
      });
      if (res.success && res.data) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? res.data! : u))
        );
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        setError(res.message || "Gagal memperbarui pengguna");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      console.error("Gagal memperbarui pengguna");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle assign role
  const handleAssignRole = async (roleName: string) => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await superadminApi.assignRole(selectedUser.id, roleName);
      if (res.success && res.data) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, roles: res.data!.roles } : u
          )
        );
        setSelectedUser((prev) =>
          prev ? { ...prev, roles: res.data!.roles } : null
        );
      } else {
        setError(res.message || "Gagal menambahkan role");
      }
    } catch (err) {
      console.error("Error assigning role:", err);
      console.error("Gagal menambahkan role");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle remove role
  const handleRemoveRole = async (roleName: string) => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await superadminApi.removeRole(selectedUser.id, roleName);
      if (res.success && res.data) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, roles: res.data!.roles } : u
          )
        );
        setSelectedUser((prev) =>
          prev ? { ...prev, roles: res.data!.roles } : null
        );
      } else {
        setError(res.message || "Gagal menghapus role");
      }
    } catch (err) {
      console.error("Error removing role:", err);
      console.error("Gagal menghapus role");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle impersonate
  const handleImpersonate = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await superadminApi.impersonateUser(selectedUser.id);
      if (res.success && res.data) {
        // Store impersonation data and redirect based on user's primary role
        const userRoles = res.data.user.roles || [];

        // Show impersonation info and close modal
        console.log(
          `Impersonasi: Anda sekarang melihat sistem sebagai ${res.data.user.name}.\n\nCatatan: Fitur impersonasi penuh memerlukan implementasi session khusus. Untuk saat ini, Anda dapat melihat data pengguna.`
        );
        setShowImpersonateModal(false);
        setSelectedUser(null);
      } else {
        setError(res.message || "Gagal melakukan impersonasi");
      }
    } catch (err) {
      console.error("Error impersonating:", err);
      console.error("Gagal melakukan impersonasi");
    } finally {
      setActionLoading(false);
    }
  };

  // Get user type badge
  const getUserTypeBadge = (user: SuperadminUser) => {
    if (user.mahasiswa) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <GraduationCap className="w-3 h-3" />
          Mahasiswa
        </span>
      );
    }
    if (user.pegawai) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <Briefcase className="w-3 h-3" />
          Pegawai
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400">
        <Users className="w-3 h-3" />
        User
      </span>
    );
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
              Manajemen Pengguna
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manajemen Pengguna
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola semua akun pengguna dalam sistem
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              {typeFilter === "mahasiswa" && (
                <button
                  onClick={openCreateMahasiswaModal}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Tambah Mahasiswa
                </button>
              )}
              {typeFilter === "pegawai" && (
                <button
                  onClick={openCreatePegawaiModal}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Tambah Pegawai
                </button>
              )}
              <button
                onClick={() => loadUsers()}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
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
                  placeholder="Cari nama, email, NIM atau NIP..."
                  autoComplete="off"
                  name="user-search"
                  id="user-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Semua Tipe</option>
                <option value="mahasiswa">Mahasiswa</option>
                <option value="pegawai">Pegawai</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total: {totalItems} pengguna
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-3 px-4 font-medium">PENGGUNA</th>
                    <th className="py-3 px-4 font-medium">TIPE</th>
                    <th className="py-3 px-4 font-medium">ROLE</th>
                    <th className="py-3 px-4 font-medium">INFO</th>
                    <th className="py-3 px-4 font-medium text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                          Memuat data...
                        </p>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        Tidak ada pengguna ditemukan
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${loading ? "opacity-50 pointer-events-none" : ""
                          }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                              {user.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{getUserTypeBadge(user)}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role) => {
                              const getRoleBadgeStyle = (r: string) => {
                                switch (r.toLowerCase()) {
                                  case "superadmin":
                                    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                                  case "upa":
                                    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
                                  case "manager_tu":
                                  case "petugas_tu":
                                    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
                                  case "supervisor_akademik":
                                  case "supervisor_kemahasiswaan":
                                  case "supervisor_sumberdaya":
                                  case "dosen_koordinator":
                                  case "dosen_pembimbing":
                                  case "dekan":
                                  case "wakil_dekan_1":
                                  case "wakil_dekan_2":
                                  case "ketua_departemen":
                                  case "ketua_prodi":
                                  case "admin_departemen":
                                    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
                                  case "mahasiswa":
                                    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
                                  default:
                                    return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
                                }
                              };
                              return (
                                <span
                                  key={role}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${getRoleBadgeStyle(role)}`}
                                >
                                  <Shield className="w-3 h-3" />
                                  {role}
                                </span>
                              );
                            })}
                            {(!user.roles || user.roles.length === 0) && (
                              <span className="text-gray-400 text-xs">No roles</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                          {user.mahasiswa && (
                            <div>NIM: {user.mahasiswa.nim}</div>
                          )}
                          {user.pegawai && (
                            <div>NIP: {user.pegawai.nip}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1 relative">
                            <button
                              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                              title="Kelola Role"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRoleModal(true);
                              }}
                            >
                              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </button>

                            <div className="relative" ref={(el) => {
                              if (el && actionMenuOpen === user.id) {
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
                                    actionMenuOpen === user.id ? null : user.id
                                  )
                                }
                              >
                                <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>

                              {actionMenuOpen === user.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setActionMenuOpen(null)}
                                  />
                                  <div data-action-menu className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setEditName(user.name || "");
                                        setEditEmail(user.email || "");
                                        setShowEditModal(true);
                                        setActionMenuOpen(null);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit Pengguna
                                    </button>
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 flex items-center gap-2"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setResetPassword("");
                                        setShowResetPasswordModal(true);
                                        setActionMenuOpen(null);
                                      }}
                                    >
                                      <Key className="w-4 h-4" />
                                      Reset Password
                                    </button>
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowImpersonateModal(true);
                                        setActionMenuOpen(null);
                                      }}
                                    >
                                      <LogIn className="w-4 h-4" />
                                      Impersonate
                                    </button>
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowDeleteModal(true);
                                        setActionMenuOpen(null);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Hapus Pengguna
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

      {/* Role Management Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-start pt-20 pb-8 justify-center overflow-y-auto bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Kelola Role: {selectedUser.name}
              </h3>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Roles */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Saat Ini
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUser.roles && selectedUser.roles.length > 0 ? (
                  selectedUser.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    >
                      <Shield className="w-4 h-4" />
                      {role}
                      <button
                        onClick={() => handleRemoveRole(role)}
                        disabled={actionLoading}
                        className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded p-0.5"
                        title="Hapus role"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">Tidak ada role</span>
                )}
              </div>
            </div>

            {/* Available Roles */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tambah Role
              </p>
              <div className="grid grid-cols-2 gap-2">
                {roles
                  .filter((r) => !selectedUser.roles?.includes(r.name))
                  .filter((r) => (selectedUser.mahasiswa ? r.name === "mahasiswa" : true))
                  .map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleAssignRole(role.name)}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600 transition-colors text-left"
                    >
                      <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {role.name}
                      </span>
                    </button>
                  ))}
              </div>
              {roles
                .filter((r) => !selectedUser.roles?.includes(r.name))
                .filter((r) => (selectedUser.mahasiswa ? r.name === "mahasiswa" : true))
                .length === 0 && (
                  <p className="text-gray-400 text-sm">
                    Semua role sudah ditambahkan
                  </p>
                )}
            </div>

            {actionLoading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-purple-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Memproses...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Pengguna
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                onClick={handleUpdateUser}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Konfirmasi Hapus
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Apakah Anda yakin ingin menghapus pengguna{" "}
              <strong>{selectedUser.name}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                onClick={handleDeleteUser}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impersonate Modal */}
      {showImpersonateModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Impersonate Pengguna
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Anda akan melihat sistem sebagai <strong>{selectedUser.name}</strong>.
              Ini berguna untuk troubleshooting masalah yang dialami pengguna.
            </p>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                ⚠️ Semua tindakan akan dicatat dengan identitas Superadmin asli.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                onClick={() => {
                  setShowImpersonateModal(false);
                  setSelectedUser(null);
                }}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                onClick={handleImpersonate}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <LogIn className="w-4 h-4" />
                Impersonate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Mahasiswa Modal */}
      {showCreateMahasiswaModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 pb-8 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tambah Mahasiswa Baru
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Buat akun pengguna mahasiswa baru
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateMahasiswaModal(false);
                  resetMahasiswaForm();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mhsError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{mhsError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  placeholder="Masukkan nama lengkap"
                  value={mhsName}
                  onChange={(e) => setMhsName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  placeholder="email@students.undip.ac.id"
                  value={mhsEmail}
                  onChange={(e) => setMhsEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password <span className="text-gray-400 text-xs font-normal">(opsional)</span>
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  placeholder="Kosongkan untuk menggunakan NIM sebagai password"
                  value={mhsPassword}
                  onChange={(e) => setMhsPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Jika dikosongkan, NIM akan digunakan sebagai password default</p>
              </div>

              {/* NIM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NIM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  placeholder="24050120140001"
                  value={mhsNim}
                  onChange={(e) => setMhsNim(e.target.value)}
                />
              </div>

              {/* Tahun Masuk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tahun Masuk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  placeholder="2024"
                  value={mhsTahunMasuk}
                  onChange={(e) => setMhsTahunMasuk(e.target.value)}
                />
              </div>

              {/* No HP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  No. HP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  placeholder="08xxxxxxxxxx"
                  value={mhsNoHp}
                  onChange={(e) => setMhsNoHp(e.target.value)}
                />
              </div>

              {/* Tempat Lahir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  placeholder="Semarang"
                  value={mhsTempatLahir}
                  onChange={(e) => setMhsTempatLahir(e.target.value)}
                />
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  value={mhsTanggalLahir}
                  onChange={(e) => setMhsTanggalLahir(e.target.value)}
                />
              </div>

              {/* Departemen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departemen <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  value={mhsDepartemenId}
                  onChange={(e) => {
                    setMhsDepartemenId(e.target.value);
                    setMhsProgramStudiId("");
                    if (e.target.value) {
                      loadProdi(e.target.value);
                    } else {
                      setProdiList([]);
                    }
                  }}
                >
                  <option value="">Pilih Departemen</option>
                  {departemenList.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program Studi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Program Studi <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  value={mhsProgramStudiId}
                  onChange={(e) => setMhsProgramStudiId(e.target.value)}
                  disabled={!mhsDepartemenId}
                >
                  <option value="">
                    {mhsDepartemenId ? "Pilih Program Studi" : "Pilih departemen terlebih dahulu"}
                  </option>
                  {prodiList
                    .filter((p) => p.departemenId === mhsDepartemenId)
                    .map((prodi) => (
                      <option key={prodi.id} value={prodi.id}>
                        {prodi.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Alamat - full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alamat
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none"
                  rows={2}
                  placeholder="Masukkan alamat lengkap"
                  value={mhsAlamat}
                  onChange={(e) => setMhsAlamat(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  setShowCreateMahasiswaModal(false);
                  resetMahasiswaForm();
                }}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-medium"
                onClick={confirmCreateMahasiswa}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <UserPlus className="w-4 h-4" />
                Tambah Mahasiswa
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Pegawai Modal */}
      {showCreatePegawaiModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 pb-8 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tambah Pegawai Baru
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Buat akun pengguna pegawai baru
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreatePegawaiModal(false);
                  resetPegawaiForm();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pgwError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{pgwError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  placeholder="Masukkan nama lengkap"
                  value={pgwName}
                  onChange={(e) => setPgwName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  placeholder="email@fsm.undip.ac.id"
                  value={pgwEmail}
                  onChange={(e) => setPgwEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password <span className="text-gray-400 text-xs font-normal">(opsional)</span>
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  placeholder="Kosongkan untuk menggunakan NIP sebagai password"
                  value={pgwPassword}
                  onChange={(e) => setPgwPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Jika dikosongkan, NIP akan digunakan sebagai password default</p>
              </div>

              {/* NIP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NIP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  placeholder="Masukkan NIP"
                  value={pgwNip}
                  onChange={(e) => setPgwNip(e.target.value)}
                />
              </div>

              {/* Jabatan / Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jabatan <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  value={pgwJabatan}
                  onChange={(e) => setPgwJabatan(e.target.value)}
                >
                  <option value="">Pilih Jabatan</option>
                  {jabatanOptions.map((j) => (
                    <option key={j.role} value={j.role}>
                      {j.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* No HP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  No. HP
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  placeholder="08xxxxxxxxxx"
                  value={pgwNoHp}
                  onChange={(e) => setPgwNoHp(e.target.value)}
                />
              </div>

            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => {
                  setShowCreatePegawaiModal(false);
                  resetPegawaiForm();
                }}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                onClick={confirmCreatePegawai}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <UserPlus className="w-4 h-4" />
                Tambah Pegawai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Konfirmasi
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Apakah Anda yakin ingin menambahkan {showConfirmCreate === "mahasiswa" ? "mahasiswa" : "pegawai"} baru?
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              Email berisi informasi akun dan password akan dikirim otomatis ke email pengguna.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                onClick={() => setShowConfirmCreate(null)}
              >
                Batal
              </button>
              <button
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 ${showConfirmCreate === "mahasiswa"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-green-600 hover:bg-green-700"
                  }`}
                disabled={actionLoading}
                onClick={async () => {
                  const type = showConfirmCreate;
                  setShowConfirmCreate(null);
                  if (type === "mahasiswa") {
                    await handleCreateMahasiswa();
                  } else {
                    await handleCreatePegawai();
                  }
                }}
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Ya, Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Reset Password Pengguna
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Masukkan password baru untuk <strong>{selectedUser?.name}</strong>.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showResetPassword ? "text" : "password"}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="Minimal 8 karakter"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                  >
                    {showResetPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {resetPasswordError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {resetPasswordError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={actionLoading}
              >
                Batal
              </button>
              <button
                onClick={handleResetUserPassword}
                disabled={actionLoading}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuperadminUsersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>}>
      <SuperadminUsersContent />
    </Suspense>
  );
}
