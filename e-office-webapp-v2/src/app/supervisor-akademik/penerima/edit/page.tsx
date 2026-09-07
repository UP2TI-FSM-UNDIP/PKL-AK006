"use client";

import React, { useState, useEffect, useRef , Suspense } from "react";
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "../../../../components/layouts/SideBar";
import TopBar from "@/components/layouts/TopBar";

import { AK006LetterTemplate } from "@/components/templates/AK006LetterTemplate";
import { letterApi, type LetterInstance } from "@/lib/api";
import { useAK006Template } from '@/hooks/use-ak006-template';
import { Loader2 } from "lucide-react";

function EditSuratPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const letterId = searchParams.get('id');

    const [zoomLevel, setZoomLevel] = useState(75);
    const [isIdentitasOpen, setIsIdentitasOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [letter, setLetter] = useState<LetterInstance | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [previewContainerWidth, setPreviewContainerWidth] = useState(0);
    // Use stored template snapshot from letter if available, otherwise fetch latest
    const { templateConfig, loading: templateLoading } = useAK006Template(letter?.templateConfig);

    // Toggle edit mode for student data
    const [editStudentData, setEditStudentData] = useState(false);

    // Confirmation modal state
    const [showConfirmSave, setShowConfirmSave] = useState(false);

    // Form states - Identitas Pemohon (initialized from API data)
    const [nama, setNama] = useState("");
    const [nim, setNim] = useState("");
    const [prodi, setProdi] = useState("");
    const [departemen, setDepartemen] = useState("");
    const [departemenId, setDepartemenId] = useState("");
    const [programStudiId, setProgramStudiId] = useState("");
    const [universitas, setUniversitas] = useState("Universitas Diponegoro");
    const [semester, setSemester] = useState("");
    const [tahunAkademik, setTahunAkademik] = useState("");
    const [email, setEmail] = useState("");
    const [tanggalLahir, setTanggalLahir] = useState("");
    const [nipPensiunan, setNipPensiunan] = useState("");
    const [namaOrangTua, setNamaOrangTua] = useState("");
    const [pangkat, setPangkat] = useState("");
    const [instansi, setInstansi] = useState("");

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
                const response = await letterApi.getSALetterById(letterId);

                if (response.success && response.data) {
                    const data = response.data;
                    setLetter(data);

                    // Populate form with API data
                    // Prioritize letter.values (data submitted by student) over letter.createdBy (default data)
                    setNama(data.values?.nama_lengkap || data.createdBy?.name || "");
                    setNim(data.values?.nim || data.createdBy?.mahasiswa?.nim || "");
                    setProdi(data.values?.program_studi || data.createdBy?.mahasiswa?.programStudi?.name || "");
                    setDepartemen(data.values?.departemen || data.createdBy?.mahasiswa?.departemen?.name || "");
                    setDepartemenId(data.createdBy?.mahasiswa?.departemen?.id || "");
                    setProgramStudiId(data.createdBy?.mahasiswa?.programStudi?.id || "");
                    setSemester(String(data.values?.semester || ""));
                    setTahunAkademik(data.values?.tahunAkademik || data.values?.tahun_akademik || "");
                    setEmail(data.values?.email || data.createdBy?.email || "");
                    setTanggalLahir(data.values?.tanggal_lahir || "");
                    setNipPensiunan(data.values?.nip_pensiun_ortu_wali || "");
                    setNamaOrangTua(data.values?.nama_ortu_wali || "");
                    setPangkat(data.values?.golongan_ortu_wali || "");
                    setInstansi(data.values?.instansi_ortu_wali || "");
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

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 10, 200));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 10, 50));
    };

    // Measure preview container width for responsive scaling
    useEffect(() => {
        const updateWidth = () => {
            if (previewContainerRef.current) {
                setPreviewContainerWidth(previewContainerRef.current.clientWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // A4 dimensions in pixels
    const A4_WIDTH = 793;
    const A4_HEIGHT = 1122;
    const baseScale = previewContainerWidth > 0 ? Math.min(1, (previewContainerWidth - 32) / A4_WIDTH) : 0.5;
    const combinedScale = baseScale * (zoomLevel / 100);
    const visualWidth = A4_WIDTH * combinedScale;
    const visualHeight = A4_HEIGHT * combinedScale;

    const handleKirimSurat = async () => {
        if (!letterId) return;

        setIsSubmitting(true);
        try {
            // Update letter data
            // Update letter data
            const updateData = {
                nama_lengkap: nama,
                nim: nim,
                email: email,
                program_studi: prodi,
                departemen: departemen,
                keperluan: letter?.values?.keperluan || '',
                semester: semester,
                tahunAkademik: tahunAkademik,
                tempat_lahir: letter?.values?.tempat_lahir || '',
                tanggal_lahir: tanggalLahir,
                no_hp: letter?.values?.no_hp || '',
                alamat: letter?.values?.alamat || '',
                nama_ortu_wali: namaOrangTua,
                nip_pensiun_ortu_wali: nipPensiunan,
                golongan_ortu_wali: pangkat,
                instansi_ortu_wali: instansi,
            };

            const letterResponse = await letterApi.updateSALetter(letterId, updateData);

            if (!letterResponse.success) {
                console.error(letterResponse.message || 'Gagal menyimpan surat');
                setIsSubmitting(false);
                return;
            }

            // If edit student data is enabled, also update student data
            if (editStudentData) {
                const studentUpdateData: any = {};
                if (nama !== letter?.createdBy?.name) studentUpdateData.name = nama;
                if (email !== letter?.createdBy?.email) studentUpdateData.email = email;
                if (nim !== letter?.createdBy?.mahasiswa?.nim) studentUpdateData.nim = nim;

                // Only update if there are changes
                if (Object.keys(studentUpdateData).length > 0) {
                    const studentResponse = await letterApi.updateSAStudentData(letterId, studentUpdateData);
                    if (!studentResponse.success) {
                        console.warn('Surat berhasil disimpan, tetapi gagal mengupdate data mahasiswa: ' + studentResponse.message);
                        setIsSubmitting(false);
                        return;
                    }
                }
            }

            // alert("Surat berhasil disimpan");
            router.push(`/supervisor-akademik/penerima/identitas-pemohon?id=${letterId}`);
        } catch (err) {
            console.error('Error saving letter:', err);
            console.error('Gagal menyimpan surat. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || templateLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar role="Supervisor Akademik" onMenuClick={() => setSidebarOpen(true)} />
                <div className="flex flex-1 bg-[#F3F3F3] dark:bg-gray-900 items-center justify-center transition-colors">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Memuat data surat...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                <TopBar role="Supervisor Akademik" onMenuClick={() => setSidebarOpen(true)} />
                <div className="flex flex-1 bg-[#F3F3F3] dark:bg-gray-900 items-center justify-center transition-colors px-4">
                    <div className="text-center">
                        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#F3F3F3] dark:bg-gray-900 transition-colors">
            <TopBar role="Supervisor Akademik" onMenuClick={() => setSidebarOpen(true)} />
            <div className="flex flex-1 min-w-0 relative">
                <AppSidebar role="supervisor-akademik" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex flex-col flex-1 min-w-0 overflow-x-hidden">
                    <main className="flex-1 flex flex-col gap-4 sm:gap-6 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-4 sm:pb-8">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 w-full">
                            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push(`/supervisor-akademik/penerima/identitas-pemohon?id=${letterId}`)}>
                                Detail Surat
                            </span>
                            <span className="mx-2">/</span>
                            <span className="text-gray-800 dark:text-white font-medium">Edit Surat</span>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 min-h-0">
                            {/* Left Sidebar - Editor */}
                            <div className="w-full lg:w-80 lg:flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-4 sm:p-6 flex flex-col lg:max-h-[calc(100vh-140px)] transition-colors">
                                <div className="flex-1 overflow-y-auto">
                                    <h2 className="text-lg sm:text-xl font-bold dark:text-white mb-2">Editor</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                                        Lengkapi data pada kembali data sebelum diketik ke dalam surat
                                    </p>

                                    {/* Identitas Pemohon Section */}
                                    <div>
                                        <button
                                            onClick={() => setIsIdentitasOpen(!isIdentitasOpen)}
                                            className="w-full flex items-center justify-between py-2 text-left mb-3 dark:text-white"
                                        >
                                            <span className="font-semibold text-sm dark:text-white">Identitas Pemohon</span>
                                            <svg
                                                width="16"
                                                height="16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                className={`transition-transform ${isIdentitasOpen ? 'rotate-180' : ''}`}
                                            >
                                                <polyline points="4 6 8 10 12 6" />
                                            </svg>
                                        </button>
                                        {isIdentitasOpen && (
                                            <div className="space-y-3">
                                                {/* Toggle Edit Mode */}
                                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors">
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Edit Data Mahasiswa</p>
                                                        <p className="text-xs text-blue-600 dark:text-blue-400">Aktifkan untuk mengedit nama, NIM, email, dsb.</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={editStudentData}
                                                            onChange={(e) => setEditStudentData(e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>

                                                {editStudentData && (
                                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800 transition-colors">
                                                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                                            <strong>Perhatian:</strong> Perubahan data mahasiswa akan tersimpan ke database dan mempengaruhi data profil mahasiswa tersebut.
                                                        </p>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Nama</label>
                                                    <input
                                                        type="text"
                                                        value={nama}
                                                        onChange={(e) => setNama(e.target.value)}
                                                        readOnly={!editStudentData}
                                                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition-colors ${editStudentData ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400' : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                                                    />
                                                    {!editStudentData && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Nama diambil dari data profil mahasiswa</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">NIM</label>
                                                    <input
                                                        type="text"
                                                        value={nim}
                                                        onChange={(e) => setNim(e.target.value)}
                                                        readOnly={!editStudentData}
                                                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition-colors ${editStudentData ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400' : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Prodi</label>
                                                    <input
                                                        type="text"
                                                        value={prodi}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed transition-colors"
                                                    />
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Untuk mengubah Prodi/Departemen, hubungi admin</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Departemen</label>
                                                    <input
                                                        type="text"
                                                        value={departemen}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Universitas</label>
                                                    <input
                                                        type="text"
                                                        value={universitas}
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        readOnly={!editStudentData}
                                                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition-colors ${editStudentData ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400' : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Semester</label>
                                                    <input
                                                        type="text"
                                                        value={semester}
                                                        onChange={(e) => setSemester(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Tahun Akademik</label>
                                                    <input
                                                        type="text"
                                                        value={tahunAkademik}
                                                        onChange={(e) => setTahunAkademik(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Tanggal Lahir</label>
                                                    <input
                                                        type="text"
                                                        value={tanggalLahir}
                                                        onChange={(e) => setTanggalLahir(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Nama Orang Tua</label>
                                                    <input
                                                        type="text"
                                                        value={namaOrangTua}
                                                        onChange={(e) => setNamaOrangTua(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">NIP / Pensiunan</label>
                                                    <input
                                                        type="text"
                                                        value={nipPensiunan}
                                                        onChange={(e) => setNipPensiunan(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Pangkat</label>
                                                    <input
                                                        type="text"
                                                        value={pangkat}
                                                        onChange={(e) => setPangkat(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Instansi</label>
                                                    <input
                                                        type="text"
                                                        value={instansi}
                                                        onChange={(e) => setInstansi(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Center - Preview */}
                            <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-3 sm:p-6 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                    <h2 className="text-lg sm:text-xl font-bold dark:text-white">Pratinjau Surat</h2>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleZoomOut}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors dark:text-gray-300"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                        <span className="text-sm font-medium min-w-[60px] text-center dark:text-gray-300">{zoomLevel}%</span>
                                        <button
                                            onClick={handleZoomIn}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors dark:text-gray-300"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M10 7V13M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors dark:text-gray-300">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* PDF Preview */}
                                <div
                                    ref={previewContainerRef}
                                    className="bg-[#E5E5E5] dark:bg-gray-700 rounded-lg p-2 sm:p-4 lg:p-8 overflow-auto transition-colors min-h-[300px] sm:min-h-[500px]"
                                >
                                    {/* Sizing wrapper */}
                                    <div style={{
                                        width: `${visualWidth}px`,
                                        height: `${visualHeight}px`,
                                        margin: '0 auto',
                                        position: 'relative',
                                    }}>
                                        {/* Full-size document, scaled from top-left */}
                                        <div
                                            className="bg-white shadow-2xl"
                                            style={{
                                                width: `${A4_WIDTH}px`,
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                transform: `scale(${combinedScale})`,
                                                transformOrigin: 'top left',
                                            }}
                                        >
                                            <AK006LetterTemplate
                                                data={{
                                                    nama_lengkap: nama || letter?.createdBy?.name || "-",
                                                    role: "Mahasiswa",
                                                    nim: nim || letter?.createdBy?.mahasiswa?.nim || "-",
                                                    email: email || letter?.createdBy?.email || "-",
                                                    departemen: departemen || letter?.createdBy?.mahasiswa?.departemen?.name || "-",
                                                    program_studi: prodi || letter?.createdBy?.mahasiswa?.programStudi?.name || "-",
                                                    tempat_lahir: letter?.values?.tempat_lahir || "-",
                                                    tanggal_lahir: tanggalLahir || letter?.values?.tanggal_lahir || "-",
                                                    no_hp: letter?.values?.no_hp || "-",
                                                    alamat: letter?.values?.alamat || "-",
                                                    jenis_surat: letter?.letterType?.name || "Surat Keterangan Masih Kuliah",
                                                    keperluan_surat: letter?.values?.keperluan || "-",
                                                    nama_ortu_wali: namaOrangTua || letter?.values?.nama_ortu_wali || "-",
                                                    nip_pensiun_ortu_wali: nipPensiunan || letter?.values?.nip_pensiun_ortu_wali || "-",
                                                    golongan_ortu_wali: pangkat || letter?.values?.golongan_ortu_wali || "-",
                                                    instansi_ortu_wali: instansi || letter?.values?.instansi_ortu_wali || "-",
                                                    semester: parseInt(semester) || letter?.values?.semester,
                                                    tahun_akademik: tahunAkademik || letter?.values?.tahunAkademik || letter?.values?.tahun_akademik,
                                                    attachments: { mandatory: [], optional: [] }
                                                }}
                                                letterNumber={letter?.letterNumber || ''}
                                                letterDate={letter?.archivedAt || letter?.updatedAt || letter?.createdAt}
                                                templateConfig={templateConfig}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                    {/* Bottom Action Bar */}
                    <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-auto transition-colors">
                        <button
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 order-2 sm:order-1"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={() => setShowConfirmSave(true)}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-8 py-2.5 bg-[#0EA5E9] dark:bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Surat'}
                        </button>
                    </div>
                </div>
            </div>
            {/* Confirmation Modal Simpan */}
            {showConfirmSave && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[110]">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200 transition-colors">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 -mx-6 -mt-6 rounded-t-2xl mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        <polyline points="17 21 17 13 7 13 7 21" />
                                        <polyline points="7 3 7 8 15 8" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white">Konfirmasi Simpan</h3>
                            </div>
                        </div>

                        <div className="px-0 py-0">
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Apakah Anda yakin ingin menyimpan perubahan pada surat ini?
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowConfirmSave(false)}
                                    className="px-5 py-2.5 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirmSave(false);
                                        handleKirimSurat();
                                    }}
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Memproses...
                                        </>
                                    ) : (
                                        'Ya, Simpan'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EditSuratPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <EditSuratPageContent />
    </Suspense>
  );
}
