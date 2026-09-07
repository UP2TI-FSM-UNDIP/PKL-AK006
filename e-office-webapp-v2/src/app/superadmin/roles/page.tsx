"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from '@/hooks/use-app-router';
import TopBar from "@/components/layouts/TopBar";
import { SuperadminSidebar } from "@/components/layouts/SuperadminSidebar";
import { superadminApi, type RoleInfo } from "@/lib/api";
import {
  Shield,
  Users,
  Lock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function SuperadminRolesPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);

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

  // Load roles
  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superadminApi.getAllRoles();
      if (res.success && res.data) {
        setRoles(res.data);
      }
    } catch (err) {
      console.error("Error loading roles:", err);
      setError("Gagal memuat data role");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const toggleExpand = (roleId: string) => {
    setExpandedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Group permissions by resource
  const groupPermissionsByResource = (
    permissions: RoleInfo["permissions"]
  ): Record<string, string[]> => {
    const grouped: Record<string, string[]> = {};
    permissions.forEach((p) => {
      const resource = p.permission.resource;
      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      grouped[resource].push(p.permission.action);
    });
    return grouped;
  };

  // Get role color based on name
  const getRoleColor = (roleName: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      superadmin: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-200 dark:border-red-800",
      },
      mahasiswa: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
      },
      supervisor_akademik: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        text: "text-purple-700 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800",
      },
      manager_tu: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-400",
        border: "border-green-200 dark:border-green-800",
      },
      upa: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        text: "text-orange-700 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800",
      },
    };
    return (
      colors[roleName.toLowerCase()] || {
        bg: "bg-gray-50 dark:bg-gray-700",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-600",
      }
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
              Manajemen Role
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manajemen Role
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Lihat dan kelola role serta permission sistem
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={loadRoles}
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => {
                const isExpanded = expandedRoles.includes(role.id);
                const colors = getRoleColor(role.name);
                const groupedPermissions = groupPermissionsByResource(role.permissions);

                return (
                  <div
                    key={role.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 overflow-hidden border ${colors.border}`}
                  >
                    {/* Role Header */}
                    <button
                      onClick={() => toggleExpand(role.id)}
                      className={`w-full px-6 py-4 flex items-center justify-between ${colors.bg} hover:opacity-80 transition-opacity`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}
                        >
                          <Shield className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <h3 className={`text-lg font-semibold ${colors.text}`}>
                            {role.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {role._count?.users || 0} pengguna •{" "}
                            {role.permissions?.length || 0} permission
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                      ) : (
                        <ChevronRight className={`w-5 h-5 ${colors.text}`} />
                      )}
                    </button>

                    {/* Permissions Detail */}
                    {isExpanded && (
                      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Permissions
                        </h4>

                        {Object.keys(groupedPermissions).length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Tidak ada permission spesifik untuk role ini
                            {role.name.toLowerCase() === "superadmin" && (
                              <span className="block mt-1 text-purple-600 dark:text-purple-400">
                                Superadmin memiliki akses penuh ke seluruh sistem.
                              </span>
                            )}
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(groupedPermissions).map(
                              ([resource, actions]) => (
                                <div
                                  key={resource}
                                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                >
                                  <p className="font-medium text-gray-900 dark:text-white text-sm mb-2 capitalize">
                                    {resource}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {actions.map((action) => (
                                      <span
                                        key={action}
                                        className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                      >
                                        {action}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {/* Users with this role */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() =>
                              router.push(`/superadmin/users?role=${role.name}`)
                            }
                            className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            <Users className="w-4 h-4" />
                            Lihat {role._count?.users || 0} pengguna dengan role ini
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Card */}
          <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-2">
              Tentang Role & Permission
            </h3>
            <p className="text-purple-600 dark:text-purple-300 text-sm">
              Role menentukan akses pengguna ke berbagai fitur sistem. Setiap role
              memiliki sekumpulan permission yang mengatur apa yang bisa dilakukan
              pengguna. Untuk mengubah role pengguna, gunakan halaman{" "}
              <button
                onClick={() => router.push("/superadmin/users")}
                className="underline hover:text-purple-800 dark:hover:text-purple-200"
              >
                Manajemen Pengguna
              </button>
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
