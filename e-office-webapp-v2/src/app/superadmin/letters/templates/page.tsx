"use client";

import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from '@/hooks/use-app-router';
import TopBar from "@/components/layouts/TopBar";
import { SuperadminSidebar } from "@/components/layouts/SuperadminSidebar";
import {
  superadminApi,
  type AK006TemplateConfig,
} from "@/lib/api";
import { AK006LetterTemplate } from "@/components/templates/AK006LetterTemplate";
import type { ProfileData } from "@/context/AK006";
import {
  Save,
  Loader2,
  RefreshCw,
  Eye,
  Edit,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const DEFAULT_TEMPLATE: AK006TemplateConfig = {
  kementerian: "KEMENTERIAN PENDIDIKAN TINGGI, SAINS,\nDAN TEKNOLOGI",
  universitas: "UNIVERSITAS DIPONEGORO",
  fakultas: "FAKULTAS SAINS DAN MATEMATIKA",
  alamat: "Jalan Prof. Jacub Rais",
  kampus: "Kampus Universitas Diponegoro",
  kota: "Tembalang, Semarang, Kode Pos 50275",
  telepon: "Telp (024) 7474754 Fax (024) 76480690",
  website: "www.fsm.undip.ac.id",
  email: "fsm(at)undip.ac.id",
  lampiran_surat:
    "SURAT EDARAN BERSAMA MENTERI KEUANGAN DAN KEPALA BADAN ADMINISTRASI KEPEGAWAIAN NEGARA",
  nomor_ref_1: "SE.1.38/DJA/1.0/7/80 (NO.SE/117/80)",
  nomor_ref_2: "19/SE/1980",
  tanggal_ref: "7 JULI 1980",
  signer_name: "Lilik Maryuni, S.E., M.Si.",
  signer_nip: "197808042001122001",
  signer_pangkat: "Pembina / IVa",
  signer_jabatan: "Manajer Bagian Tata Usaha",
  signer_instansi:
    "Fakultas Sains dan Matematika Universitas Diponegoro",
  letter_number_format: "...../UN7.F8.4/AK/.../20..",
  letter_title: "SURAT PERNYATAAN MASIH KULIAH",
  signer_atas_nama: "a.n. Dekan,",
  signer_untuk_beliau: "u.b. Manajer Bagian Tata Usaha,",
};

// Sample data for preview
const PREVIEW_DATA: ProfileData = {
  nama_lengkap: "",
  role: "mahasiswa",
  nim: "",
  email: "",
  departemen: "",
  program_studi: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  no_hp: "",
  alamat: "",
  jenis_surat: "AK006",
  keperluan_surat: "",
  nama_ortu_wali: "",
  nip_pensiun_ortu_wali: "",
  golongan_ortu_wali: "",
  instansi_ortu_wali: "",
  semester: undefined,
  tahun_akademik: "",
  attachments: { mandatory: [], optional: [] },
};

type FieldGroup = {
  title: string;
  description: string;
  fields: { key: keyof AK006TemplateConfig; label: string; multiline?: boolean }[];
};

const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "Kop Surat",
    description: "Informasi header surat (kementerian, universitas, fakultas)",
    fields: [
      { key: "kementerian", label: "Kementerian", multiline: true },
      { key: "universitas", label: "Universitas" },
      { key: "fakultas", label: "Fakultas" },
      { key: "alamat", label: "Alamat" },
      { key: "kampus", label: "Kampus" },
      { key: "kota", label: "Kota & Kode Pos" },
      { key: "telepon", label: "Telepon / Fax" },
      { key: "website", label: "Website" },
      { key: "email", label: "Email" },
    ],
  },
  {
    title: "Referensi Surat",
    description: "Lampiran dan nomor referensi surat",
    fields: [
      { key: "lampiran_surat", label: "Lampiran Surat", multiline: true },
      { key: "nomor_ref_1", label: "Nomor Referensi 1" },
      { key: "nomor_ref_2", label: "Nomor Referensi 2" },
      { key: "tanggal_ref", label: "Tanggal Referensi" },
    ],
  },
  {
    title: "Judul & Format Surat",
    description: "Judul surat dan format penomoran",
    fields: [
      { key: "letter_title", label: "Judul Surat" },
      { key: "letter_number_format", label: "Format Nomor Surat" },
    ],
  },
  {
    title: "Penandatangan",
    description: "Informasi pejabat yang menandatangani surat",
    fields: [
      { key: "signer_name", label: "Nama Penandatangan" },
      { key: "signer_nip", label: "NIP" },
      { key: "signer_pangkat", label: "Pangkat / Golongan" },
      { key: "signer_jabatan", label: "Jabatan" },
      { key: "signer_instansi", label: "Instansi", multiline: true },
      { key: "signer_atas_nama", label: "Atas Nama" },
      { key: "signer_untuk_beliau", label: "Untuk Beliau" },
    ],
  },
];

export default function SuperadminTemplatesPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AK006TemplateConfig>(DEFAULT_TEMPLATE);
  const [originalConfig, setOriginalConfig] = useState<AK006TemplateConfig>(DEFAULT_TEMPLATE);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [hasChanges, setHasChanges] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewContainerWidth, setPreviewContainerWidth] = useState(0);

  // A4 dimensions in px at 96 dpi
  const A4_WIDTH = 794; // 210mm
  const A4_HEIGHT = 1123; // 297mm

  // Measure preview container width for responsive scaling
  useEffect(() => {
    const measure = () => {
      if (previewContainerRef.current) {
        setPreviewContainerWidth(previewContainerRef.current.clientWidth);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (previewContainerRef.current) observer.observe(previewContainerRef.current);
    return () => observer.disconnect();
  }, [activeTab]);

  // Compute render scale: fit the A4 width into the container, capped at 0.85
  const rawScale = previewContainerWidth > 0 ? previewContainerWidth / A4_WIDTH : 0.75;
  const previewScale = Math.min(rawScale, 0.85);
  const visualWidth = A4_WIDTH * previewScale;
  const visualHeight = A4_HEIGHT * previewScale;

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

  // Load template
  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superadminApi.getAK006Template();
      if (res.success && res.data) {
        const loaded = { ...DEFAULT_TEMPLATE, ...res.data.config };
        setConfig(loaded);
        setOriginalConfig(loaded);
        setHasChanges(false);
      }
    } catch (err) {
      console.error("Error loading template:", err);
      setError("Gagal memuat template");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, []);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasChanges(changed);
  }, [config, originalConfig]);

  // Handle field change
  const handleChange = (key: keyof AK006TemplateConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Handle save click
  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  // Execute save template
  const executeSave = async () => {
    try {
      setShowConfirmModal(false);
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await superadminApi.updateAK006Template(config);
      if (res.success) {
        setOriginalConfig(config);
        setHasChanges(false);
        setSuccess("Template berhasil disimpan!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res.message || "Gagal menyimpan template");
      }
    } catch (err) {
      console.error("Error saving template:", err);
      setError("Gagal menyimpan template");
    } finally {
      setSaving(false);
    }
  };

  // Reset to original
  const handleReset = () => {
    setConfig(originalConfig);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <TopBar role="Superadmin" onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex flex-1 bg-[#F3F3F3] dark:bg-gray-900">
        <SuperadminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 pt-8 pb-8 px-4 sm:px-8 lg:px-16 overflow-x-hidden">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            <span
              className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              onClick={() => router.push("/superadmin/dashboard")}
            >
              Dasbor
            </span>
            <span className="mx-2">/</span>
            <span
              className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              onClick={() => router.push("/superadmin/letters")}
            >
              Surat
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-800 dark:text-white font-medium">
              Template AK006
            </span>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-7 h-7 text-purple-600" />
                Template Surat AK006
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola template Surat Keterangan Masih Kuliah
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <button
                onClick={loadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={handleSaveClick}
                disabled={saving || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan Template
              </button>
            </div>
          </div>

          {/* Status messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-700 dark:text-green-400">{success}</p>
            </div>
          )}

          {hasChanges && (
            <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-between">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Ada perubahan yang belum disimpan
              </p>
              <button
                onClick={handleReset}
                className="text-sm text-yellow-700 dark:text-yellow-400 hover:underline"
              >
                Kembalikan
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 shadow w-fit">
            <button
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "edit"
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              <Edit className="w-4 h-4" />
              Edit Template
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "preview"
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              <Eye className="w-4 h-4" />
              Preview Surat
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : activeTab === "edit" ? (
            /* Edit Form */
            <div className="space-y-6">
              {FIELD_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {group.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {group.description}
                    </p>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.fields.map((field) => (
                      <div
                        key={field.key}
                        className={field.multiline ? "md:col-span-2" : ""}
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {field.label}
                        </label>
                        {field.multiline ? (
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-y"
                            rows={3}
                            value={config[field.key]}
                            onChange={(e) =>
                              handleChange(field.key, e.target.value)
                            }
                          />
                        ) : (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                            value={config[field.key]}
                            onChange={(e) =>
                              handleChange(field.key, e.target.value)
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Save button at bottom */}
              <div className="flex justify-end gap-3 pb-4">
                <button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  onClick={handleSaveClick}
                  disabled={saving || !hasChanges}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Simpan Template
                </button>
              </div>
            </div>
          ) : (
            /* Preview */
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 p-6">
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Preview menggunakan data contoh. Tampilan ini menunjukkan
                  bagaimana surat akan terlihat ketika dicetak dengan
                  konfigurasi template saat ini.
                </p>
              </div>
              <div
                ref={previewContainerRef}
                className="bg-[#E5E5E5] dark:bg-gray-700 rounded-lg p-4 sm:p-6 lg:p-8 overflow-hidden"
              >
                <div
                  style={{
                    width: `${visualWidth}px`,
                    height: `${visualHeight}px`,
                    margin: "0 auto",
                    position: "relative",
                  }}
                >
                  <div
                    className="bg-white shadow-2xl"
                    style={{
                      width: `${A4_WIDTH}px`,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <AK006LetterTemplate
                      ref={previewRef}
                      data={PREVIEW_DATA}
                      letterNumber="12345/UN7.F8.4/AK/2026"
                      letterDate={new Date().toISOString()}
                      letterId="preview-123"
                      status="COMPLETED"
                      showQRCode={false}
                      templateConfig={config}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl p-8 transition-colors duration-300 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Simpan Perubahan Template</h2>

            <div className="space-y-6 mb-8">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg p-4 transition-colors duration-300 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-800 dark:text-yellow-300 leading-relaxed">
                  <p className="font-medium mb-1">Apakah Anda yakin ingin menyimpan perubahan pada template ini?</p>
                  <span className="text-sm opacity-90">Perubahan ini akan disimpan sebagai versi template baru. Surat yang sudah diajukan sebelumnya <strong>tidak akan terpengaruh</strong> dan tetap menggunakan template lama. Hanya surat yang diajukan setelah perubahan ini yang akan menggunakan template baru.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={executeSave}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Ya, Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
