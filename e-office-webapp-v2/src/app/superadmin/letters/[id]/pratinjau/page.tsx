"use client";

import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from '@/hooks/use-app-router'
import { useParams } from "next/navigation";
import TopBar from "@/components/layouts/TopBar";
import { SuperadminSidebar } from "@/components/layouts/SuperadminSidebar";
import {
  superadminApi,
  type LetterInstance,
  getStatusLabel,
  getStatusColor,
} from "@/lib/api";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import { AK006LetterTemplate } from "@/components/templates/AK006LetterTemplate";
import { useAK006Template } from "@/hooks/use-ak006-template";

export default function SuperadminPratinjauPage() {
  const router = useRouter();
  const params = useParams();
  const letterId = params.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [letter, setLetter] = useState<LetterInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { templateConfig, loading: templateLoading } = useAK006Template(letter?.templateConfig);

  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  // Load letter data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileRes = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
        if (!profileRes.ok) {
          router.push("/auth");
          return;
        }
        const profileData = await profileRes.json();
        const roles = profileData.data?.roles || profileData.roles || [];
        if (!roles.some((r: string) => r.toLowerCase() === "superadmin")) {
          router.push("/auth");
          return;
        }

        const letterRes = await superadminApi.getLetterById(letterId);
        if (letterRes.success && letterRes.data) {
          setLetter(letterRes.data);
        } else {
          setError("Surat tidak ditemukan");
        }
      } catch (err) {
        console.error("Error loading letter:", err);
        setError("Gagal memuat data surat");
      } finally {
        setLoading(false);
      }
    };

    if (letterId) loadData();
  }, [letterId, router]);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Map letter data to template format
  const letterValues = (letter?.values || {}) as Record<string, any>;
  const mahasiswa = letter?.createdBy?.mahasiswa;
  const templateData = letter
    ? {
        nama_lengkap: letterValues?.nama_lengkap || letter.createdBy?.name || "-",
        role: "Mahasiswa",
        nim: letterValues?.nim || mahasiswa?.nim || "-",
        email: letterValues?.email || letter.createdBy?.email || "-",
        departemen: letterValues?.departemen || mahasiswa?.departemen?.name || "-",
        program_studi: letterValues?.program_studi || mahasiswa?.programStudi?.name || "-",
        tempat_lahir: letterValues?.tempat_lahir || "-",
        tanggal_lahir: letterValues?.tanggal_lahir || "-",
        no_hp: letterValues?.no_hp || "-",
        alamat: letterValues?.alamat || "-",
        jenis_surat: letter.letterType?.name || "Surat Keterangan Masih Kuliah",
        keperluan_surat: letterValues?.keperluan || "-",
        nama_ortu_wali: letterValues?.nama_ortu_wali || "-",
        nip_pensiun_ortu_wali: letterValues?.nip_pensiun_ortu_wali || "-",
        golongan_ortu_wali: letterValues?.golongan_ortu_wali || "-",
        instansi_ortu_wali: letterValues?.instansi_ortu_wali || "-",
        semester: letterValues?.semester,
        tahun_akademik: letterValues?.tahunAkademik || letterValues?.tahun_akademik,
        attachments: { mandatory: [], optional: [] },
      }
    : null;

  // Zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(100);

  const A4_WIDTH = 793;
  const A4_HEIGHT = 1122;
  const baseScale = containerWidth > 0 ? Math.min(1, (containerWidth - 16) / A4_WIDTH) : 0.5;
  const combinedScale = baseScale * (zoom / 100);
  const visualWidth = A4_WIDTH * combinedScale;
  const visualHeight = A4_HEIGHT * combinedScale;

  const handlePrint = () => window.print();

  if (loading || templateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Memuat pratinjau...</p>
        </div>
      </div>
    );
  }

  if (error || !letter || !templateData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <TopBar role="Superadmin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">
              {error || "Surat tidak ditemukan"}
            </p>
            <button
              onClick={() => router.push(`/superadmin/letters/${letterId}`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Kembali ke Detail Surat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div className="min-h-screen flex flex-col no-print bg-white dark:bg-gray-900">
        <TopBar role="Superadmin" onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex flex-1 bg-[#F3F3F3] dark:bg-gray-900">
          <SuperadminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
              <span
                className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                onClick={() => router.push(`/superadmin/letters/${letterId}`)}
              >
                Detail Surat
              </span>
              <span className="mx-2">/</span>
              <span className="text-gray-800 dark:text-white font-medium">
                Pratinjau Surat
              </span>
            </div>

            {/* Header with controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(`/superadmin/letters/${letterId}`)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Kembali
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pratinjau Surat
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {letter.letterNumber || "Belum dinomori"}
                    </p>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: getStatusColor(letter.status) + "20",
                        color: getStatusColor(letter.status),
                      }}
                    >
                      {getStatusLabel(letter.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-sm">
                  <button
                    onClick={handleZoomOut}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold text-lg"
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <button
                    onClick={handleZoomReset}
                    className="text-gray-700 dark:text-gray-300 font-medium min-w-[50px] text-center hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-0.5 rounded"
                  >
                    {zoom}%
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold text-lg"
                    title="Zoom In"
                  >
                    +
                  </button>
                </div>

                {letter.status === "COMPLETED" && (
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Cetak / Download PDF
                  </button>
                )}
              </div>
            </div>

            {/* Document Viewer */}
            <div
              ref={containerRef}
              className="bg-[#E5E5E5] dark:bg-gray-950 rounded-lg p-2 sm:p-4 lg:p-8 overflow-auto"
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
                    transform: `scale(${combinedScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <AK006LetterTemplate
                    data={templateData}
                    signatureUrl={letter.signatureUrl}
                    letterNumber={letter.letterNumber || ""}
                    letterDate={letter.archivedAt || letter.updatedAt || letter.createdAt}
                    letterId={letter.id}
                    status={letter.status}
                    showQRCode={false}
                    templateConfig={templateConfig}
                  />
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push(`/superadmin/letters/${letterId}`)}
                className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm"
              >
                Kembali ke Detail
              </button>
              {letter.status === "COMPLETED" && (
                <button
                  onClick={handlePrint}
                  className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Cetak / Download PDF
                </button>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Print Area */}
      <div id="print-area" ref={printRef} style={{ display: "none" }}>
        <style>{`
          @media print {
            #print-area { display: block !important; }
          }
        `}</style>
        <AK006LetterTemplate
          data={templateData}
          signatureUrl={letter.signatureUrl}
          letterNumber={letter.letterNumber || ""}
          letterDate={letter.archivedAt || letter.updatedAt || letter.createdAt}
          letterId={letter.id}
          status={letter.status}
          templateConfig={templateConfig}
        />
      </div>
    </>
  );
}
