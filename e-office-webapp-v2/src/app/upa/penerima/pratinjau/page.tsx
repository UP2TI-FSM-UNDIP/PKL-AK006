"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "../../../../components/layouts/SideBar";
import TopBar from "@/components/layouts/TopBar";

import { AK006LetterTemplate } from "@/components/templates/AK006LetterTemplate";
import { letterApi, formatDate, type LetterInstance } from "@/lib/api";
import { useAK006Template } from "@/hooks/use-ak006-template";

function PratinjauSuratPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const letterId = searchParams.get('id');

    const [zoom, setZoom] = useState(100);
    const [letter, setLetter] = useState<LetterInstance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    // Use stored template snapshot from letter if available, otherwise fetch latest
    const { templateConfig, loading: templateLoading } = useAK006Template(letter?.templateConfig);

    // Fetch letter data
    useEffect(() => {
        const fetchLetter = async () => {
            if (!letterId) {
                setError('ID surat tidak ditemukan');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const response = await letterApi.getUPALetterById(letterId);

                if (response.success && response.data) {
                    setLetter(response.data);
                } else {
                    setError(response.message || 'Gagal memuat data surat');
                }
            } catch (err) {
                console.error('Error fetching letter:', err);
                setError('Gagal memuat data surat. Pastikan server API berjalan.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLetter();
    }, [letterId]);

    // Map letter data to template format
    // Prioritize letter.values (data submitted by student) over letter.createdBy (default data)
    const templateData = letter ? {
        nama_lengkap: letter.values?.nama_lengkap || letter.createdBy?.name || '-',
        role: "Mahasiswa",
        nim: letter.values?.nim || letter.createdBy?.mahasiswa?.nim || '-',
        email: letter.values?.email || letter.createdBy?.email || '-',
        departemen: letter.values?.departemen || letter.createdBy?.mahasiswa?.departemen?.name || '-',
        program_studi: letter.values?.program_studi || letter.createdBy?.mahasiswa?.programStudi?.name || '-',
        tempat_lahir: letter.values?.tempat_lahir || '-',
        tanggal_lahir: letter.values?.tanggal_lahir || '-',
        no_hp: letter.values?.no_hp || '-',
        alamat: letter.values?.alamat || '-',
        jenis_surat: letter.letterType?.name || 'Surat Keterangan Masih Kuliah',
        keperluan_surat: letter.values?.keperluan || '-',
        nama_ortu_wali: letter.values?.nama_ortu_wali || '-',
        nip_pensiun_ortu_wali: letter.values?.nip_pensiun_ortu_wali || '-',
        golongan_ortu_wali: letter.values?.golongan_ortu_wali || '-',
        instansi_ortu_wali: letter.values?.instansi_ortu_wali || '-',
        semester: letter.values?.semester,
        tahun_akademik: letter.values?.tahunAkademik || letter.values?.tahun_akademik,
        attachments: { mandatory: [], optional: [] }
    } : {
        nama_lengkap: '-',
        role: '-',
        nim: '-',
        email: '-',
        departemen: '-',
        program_studi: '-',
        tempat_lahir: '-',
        tanggal_lahir: '-',
        no_hp: '-',
        alamat: '-',
        jenis_surat: '-',
        keperluan_surat: '-',
        nama_ortu_wali: '-',
        nip_pensiun_ortu_wali: '-',
        golongan_ortu_wali: '-',
        instansi_ortu_wali: '-',
        attachments: { mandatory: [], optional: [] }
    };

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 10, 200));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 10, 50));
    };

    const handleZoomReset = () => {
        setZoom(100);
    };

    // Measure container width for responsive scaling
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const A4_WIDTH = 793;
    const A4_HEIGHT = 1122;
    const baseScale = containerWidth > 0 ? Math.min(1, (containerWidth - 16) / A4_WIDTH) : 0.5;
    const combinedScale = baseScale * (zoom / 100);
    const visualWidth = A4_WIDTH * combinedScale;
    const visualHeight = A4_HEIGHT * combinedScale;

    if (isLoading || templateLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar role="UPA" onMenuClick={() => setSidebarOpen(true)} />
                <div className="flex flex-1 bg-[#F3F3F3] dark:bg-gray-900 items-center justify-center transition-colors">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <svg className="animate-spin h-5 w-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Memuat data...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar role="UPA" onMenuClick={() => setSidebarOpen(true)} />
                <div className="flex flex-1 bg-[#F3F3F3] dark:bg-gray-900 items-center justify-center px-4 transition-colors">
                    <div className="text-center">
                        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar role="UPA" onMenuClick={() => setSidebarOpen(true)} />
            <div className="flex flex-1 min-w-0 bg-[#F3F3F3] dark:bg-gray-900 transition-colors">
                <AppSidebar role="upa" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <main className="flex-1 min-w-0 overflow-x-hidden px-3 sm:px-6 lg:px-12 pt-4 sm:pt-8 pb-8">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push(`/upa/penerima/identitas-pemohon?id=${letterId}`)}>
                            Detail Surat
                        </span>
                        <span className="mx-2">/</span>
                        <span className="text-gray-800 dark:text-white font-medium">Pratinjau</span>
                    </div>
                    {/* Header with Zoom Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                        <div className="flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 dark:text-gray-400 shrink-0">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Pratinjau Surat</h1>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                                <button onClick={handleZoomOut} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold text-lg transition-colors" title="Zoom Out">−</button>
                                <button onClick={handleZoomReset} className="text-gray-700 dark:text-gray-300 font-medium min-w-[50px] sm:min-w-[60px] text-center hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors text-sm">{zoom}%</button>
                                <button onClick={handleZoomIn} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold text-lg transition-colors" title="Zoom In">+</button>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap transition-colors">Halaman 1 dari 1</div>
                        </div>
                    </div>

                    {/* Document Viewer */}
                    <div ref={containerRef} className="bg-[#E5E5E5] dark:bg-gray-800 rounded-lg p-2 sm:p-4 lg:p-8 overflow-auto transition-colors min-h-[400px] sm:min-h-[600px]">
                        <div style={{ width: `${visualWidth}px`, height: `${visualHeight}px`, margin: '0 auto', position: 'relative' }}>
                            <div className="bg-white dark:bg-gray-100 shadow-2xl" style={{ width: `${A4_WIDTH}px`, position: 'absolute', top: 0, left: 0, transform: `scale(${combinedScale})`, transformOrigin: 'top left' }}>
                                <AK006LetterTemplate
                                    data={templateData}
                                    signatureUrl={letter?.signatureUrl}
                                    letterNumber={letter?.letterNumber || ''}
                                    letterDate={letter?.archivedAt || letter?.updatedAt || letter?.createdAt}
                                    letterId={letter?.id}
                                    status={letter?.status}
                                    templateConfig={templateConfig}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Back Button */}
                    <div className="mt-4 sm:mt-6">
                        <button
                            onClick={() => router.back()}
                            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
                        >
                            Kembali
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function PratinjauSuratPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
            <PratinjauSuratPageContent />
        </Suspense>
    );
}
