"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "../../../../components/layouts/SideBar";
import TopBar from "@/components/layouts/TopBar";
import {
    letterApi,
    type LetterInstance,
    getStatusLabel,
    getStatusColor,
    getStepLabel
} from "@/lib/api";
import { Loader2, X, Check, ArrowLeft, AlertCircle, Paperclip, Clock, PenTool, Eye, Download, Edit3, RotateCcw } from "lucide-react";
import { LetterTimeline } from "@/components/letter/LetterTimeline";
import { AttachmentList } from "@/components/letter/AttachmentList";
import { ApplicantInfoCard } from "@/components/letter/details/ApplicantInfoCard";
import { LetterDetailsCard } from "@/components/letter/details/LetterDetailsCard";
import { ParentInfoCard } from "@/components/letter/details/ParentInfoCard";
import { LetterPreviewCard } from "@/components/letter/LetterPreviewCard";
import { useAK006Template } from "@/hooks/use-ak006-template";

function IdentitasPemohonContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const letterId = searchParams.get('id');

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [letter, setLetter] = useState<LetterInstance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    // Form states
    const [nama, setNama] = useState("");
    const [nim, setNim] = useState("");
    const [email, setEmail] = useState("");
    const [prodi, setProdi] = useState("");
    const [departemen, setDepartemen] = useState("");
    const [semester, setSemester] = useState("");
    const [tahunAkademik, setTahunAkademik] = useState("");
    const [tanggalLahir, setTanggalLahir] = useState("");
    const [namaOrangTua, setNamaOrangTua] = useState("");
    const [nipPensiunan, setNipPensiunan] = useState("");
    const [pangkat, setPangkat] = useState("");
    const [instansi, setInstansi] = useState("");

    // Card expansion state
    const [expanded, setExpanded] = useState({
        applicant: true,
        details: true,
        parent: true,
        lampiran: true,
        preview: true,
    });

    const { templateConfig, loading: templateLoading } = useAK006Template(letter?.templateConfig);

    // Action State (Inline instead of Modal)
    const [activeAction, setActiveAction] = useState<'none' | 'approve' | 'reject' | 'revision'>('none');
    const [actionComment, setActionComment] = useState("");

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

                    // Initialize form states
                    setNama(data.values?.nama_lengkap || data.createdBy?.name || "");
                    setNim(data.values?.nim || data.createdBy?.mahasiswa?.nim || "");
                    setEmail(data.values?.email || data.createdBy?.email || "");
                    setProdi(data.values?.program_studi || data.values?.programStudi || data.createdBy?.mahasiswa?.programStudi?.name || "");
                    setDepartemen(data.values?.departemen || data.createdBy?.mahasiswa?.departemen?.name || "");
                    setSemester(String(data.values?.semester || ""));
                    setTahunAkademik(data.values?.tahunAkademik || data.values?.tahun_akademik || "");
                    setTanggalLahir(data.values?.tanggal_lahir || "");
                    setNamaOrangTua(data.values?.nama_ortu_wali || "");
                    setNipPensiunan(data.values?.nip_pensiun_ortu_wali || "");
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

    // Handle SA actions
    const handleAction = async () => {
        if (!letter) return;
        setActionLoading(true);
        try {
            let res;
            const type = activeAction;

            if (type === 'approve' || type === 'reject' || type === 'revision') {
                res = await letterApi.verifyLetter(letter.id, type, actionComment);
            }

            if (res?.success && res.data) {
                setLetter(res.data);
                setActiveAction('none');
                setActionComment("");
                setTimelineRefreshKey(prev => prev + 1);
            } else {
                alert(res?.message || "Gagal memproses aksi");
            }
        } catch (err) {
            console.error("Action error:", err);
            alert("Terjadi kesalahan sistem");
        } finally {
            setActionLoading(false);
        }
    };

    const handleSave = async () => {
        if (!letterId || !letter) return;
        setActionLoading(true);
        try {
            const updateData = {
                nama_lengkap: nama,
                nim: nim,
                email: email,
                program_studi: prodi,
                departemen: departemen,
                keperluan: letter.values?.keperluan || '',
                semester: semester,
                tahunAkademik: tahunAkademik,
                tempat_lahir: letter.values?.tempat_lahir || '',
                tanggal_lahir: tanggalLahir,
                no_hp: letter.values?.no_hp || '',
                alamat: letter.values?.alamat || '',
                nama_ortu_wali: namaOrangTua,
                nip_pensiun_ortu_wali: nipPensiunan,
                golongan_ortu_wali: pangkat,
                instansi_ortu_wali: instansi,
            };

            const response = await letterApi.updateSALetter(letterId, updateData);
            if (response.success) {
                // Refresh letter data
                const refreshRes = await letterApi.getSALetterById(letterId);
                if (refreshRes.success && refreshRes.data) {
                    setLetter(refreshRes.data);
                }
                setIsEditMode(false);
                setTimelineRefreshKey(prev => prev + 1);
            } else {
                alert(response.message || "Gagal menyimpan perubahan");
            }
        } catch (err) {
            console.error("Save error:", err);
            alert("Terjadi kesalahan saat menyimpan");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = () => {
        if (letter) {
            // Revert form states
            setNama(letter.values?.nama_lengkap || letter.createdBy?.name || "");
            setNim(letter.values?.nim || letter.createdBy?.mahasiswa?.nim || "");
            setEmail(letter.values?.email || letter.createdBy?.email || "");
            setProdi(letter.values?.program_studi || letter.values?.programStudi || letter.createdBy?.mahasiswa?.programStudi?.name || "");
            setDepartemen(letter.values?.departemen || letter.createdBy?.mahasiswa?.departemen?.name || "");
            setSemester(String(letter.values?.semester || ""));
            setTahunAkademik(letter.values?.tahunAkademik || letter.values?.tahun_akademik || "");
            setTanggalLahir(letter.values?.tanggal_lahir || "");
            setNamaOrangTua(letter.values?.nama_ortu_wali || "");
            setNipPensiunan(letter.values?.nip_pensiun_ortu_wali || "");
            setPangkat(letter.values?.golongan_ortu_wali || "");
            setInstansi(letter.values?.instansi_ortu_wali || "");
        }
        setIsEditMode(false);
    };

    const getVal = (val: any) => {
        if (!val) return '-';
        if (typeof val === 'object') return val.name || val.nama || '-';
        return val;
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
                <TopBar role="Supervisor Akademik" />
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Memuat data surat...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !letter) {
        return (
            <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
                <TopBar role="Supervisor Akademik" />
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "Surat tidak ditemukan"}</p>
                        <button onClick={() => router.push('/supervisor-akademik/dashboard')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Kembali ke Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const canAction = letter.currentStep === 1 && letter.status === 'PENDING';

    const mappedData = {
        namaLengkap: getVal(letter.values?.nama_lengkap || letter.values?.namaLengkap || letter.createdBy?.name),
        nim: getVal(letter.values?.nim || letter.createdBy?.mahasiswa?.nim),
        email: getVal(letter.values?.email || letter.createdBy?.email),
        departemen: getVal(letter.values?.departemen || letter.createdBy?.mahasiswa?.departemen),
        programStudi: getVal(letter.values?.program_studi || letter.values?.programStudi || letter.createdBy?.mahasiswa?.programStudi),
        tempatLahir: getVal(letter.values?.tempat_lahir || letter.values?.tempatLahir),
        tanggalLahir: getVal(letter.values?.tanggal_lahir || letter.values?.tanggalLahir),
        noHP: getVal(letter.values?.no_hp || letter.values?.noHP),
        alamat: getVal(letter.values?.alamat),
        jenisSurat: getVal(letter.letterType?.name),
        keperluan: getVal(letter.values?.keperluan),
        semester: getVal(letter.values?.semester),
        tahunAkademik: getVal(letter.values?.tahunAkademik || letter.values?.tahun_akademik),
        namaOrtuWali: getVal(letter.values?.nama_ortu_wali || letter.values?.namaOrtuWali),
        nipPensiunOrtuWali: getVal(letter.values?.nip_pensiun_ortu_wali || letter.values?.nipPensiunOrtuWali),
        golonganOrtuWali: getVal(letter.values?.golongan_ortu_wali || letter.values?.golonganOrtuWali || letter.values?.pangkatGolongan),
        instansiOrtuWali: getVal(letter.values?.instansi_ortu_wali || letter.values?.instansiOrtuWali),
    };

    const templateData = letter ? {
        nama_lengkap: isEditMode ? nama : (letter.values?.nama_lengkap || letter.createdBy?.name || '-'),
        role: "Mahasiswa",
        nim: isEditMode ? nim : (letter.values?.nim || letter.createdBy?.mahasiswa?.nim || '-'),
        email: isEditMode ? email : (letter.values?.email || letter.createdBy?.email || '-'),
        departemen: isEditMode ? departemen : (letter.values?.departemen || letter.createdBy?.mahasiswa?.departemen?.name || '-'),
        program_studi: isEditMode ? prodi : (letter.values?.program_studi || letter.createdBy?.mahasiswa?.programStudi?.name || '-'),
        tempat_lahir: letter.values?.tempat_lahir || '-',
        tanggal_lahir: isEditMode ? tanggalLahir : (letter.values?.tanggal_lahir || '-'),
        no_hp: letter.values?.no_hp || '-',
        alamat: letter.values?.alamat || '-',
        jenis_surat: letter.letterType?.name || 'Surat Keterangan Masih Kuliah',
        keperluan_surat: letter.values?.keperluan || '-',
        nama_ortu_wali: isEditMode ? namaOrangTua : (letter.values?.nama_ortu_wali || '-'),
        nip_pensiun_ortu_wali: isEditMode ? nipPensiunan : (letter.values?.nip_pensiun_ortu_wali || '-'),
        golongan_ortu_wali: isEditMode ? pangkat : (letter.values?.golongan_ortu_wali || '-'),
        instansi_ortu_wali: isEditMode ? instansi : (letter.values?.instansi_ortu_wali || '-'),
        semester: isEditMode ? semester : letter.values?.semester,
        tahun_akademik: isEditMode ? tahunAkademik : (letter.values?.tahunAkademik || letter.values?.tahun_akademik),
        attachments: { mandatory: [], optional: [] }
    } : null;

    return (
        <div className="min-h-screen flex flex-col dark:bg-gray-900 transition-colors duration-300">
            <TopBar role="Supervisor Akademik" onMenuClick={() => setSidebarOpen(true)} />

            <div className="flex flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <AppSidebar role="supervisor-akademik" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-8 lg:px-24 pb-24">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <button
                                onClick={() => router.push('/supervisor-akademik/dashboard')}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition"
                            >
                                <ArrowLeft size={18} />
                                <span>Kembali</span>
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Pengajuan Surat</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">ID: {letter.letterNumber || 'Belum dinomori'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span
                                className="px-4 py-1.5 rounded-full text-sm font-semibold"
                                style={{ backgroundColor: `${getStatusColor(letter.status)}20`, color: getStatusColor(letter.status) }}
                            >
                                {getStatusLabel(letter.status)}
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-1.5 rounded-full text-sm font-medium">
                                Tahap: {getStepLabel(letter.currentStep)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left Column: Data */}
                        <div className="lg:col-span-2 space-y-6">
                            <LetterPreviewCard
                                letter={letter}
                                templateData={templateData}
                                templateConfig={templateConfig}
                                letterNumber={letter?.letterNumber}
                                letterDate={letter?.archivedAt || letter?.updatedAt || letter?.createdAt}
                                signatureUrl={letter?.signatureUrl}
                                isOpen={expanded.preview}
                                onToggle={() => setExpanded({ ...expanded, preview: !expanded.preview })}
                            />
                            <ApplicantInfoCard
                                data={mappedData}
                                isOpen={expanded.applicant}
                                onToggle={() => setExpanded({ ...expanded, applicant: !expanded.applicant })}
                            />
                            <LetterDetailsCard
                                data={mappedData}
                                isOpen={expanded.details}
                                onToggle={() => setExpanded({ ...expanded, details: !expanded.details })}
                            />
                            <ParentInfoCard
                                data={{
                                    nama: mappedData.namaOrtuWali,
                                    nipPensiun: mappedData.nipPensiunOrtuWali,
                                    pangkatGolongan: mappedData.golonganOrtuWali,
                                    instansi: mappedData.instansiOrtuWali
                                }}
                                isOpen={expanded.parent}
                                onToggle={() => setExpanded({ ...expanded, parent: !expanded.parent })}
                            />

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                                <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => setExpanded({ ...expanded, lampiran: !expanded.lampiran })}>
                                    <Paperclip className="w-5 h-5 text-blue-500" />
                                    <h2 className="text-lg font-semibold dark:text-white">Lampiran</h2>
                                    <svg width="20" height="20" fill="none" stroke="#0EA5E9" strokeWidth="2" className={`transition-transform ${expanded.lampiran ? 'rotate-0' : 'rotate-180'}`}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                                {expanded.lampiran && (
                                    <AttachmentList attachments={letter?.attachments} />
                                )}
                            </div>
                        </div>

                        {/* Right Column: Actions & Timeline */}
                        <div className="space-y-6 sticky top-24 self-start">
                            {/* Hide old preview card as it's now inline */}
                            {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                                <h3 className="font-semibold mb-4 dark:text-white">Lihat Pratinjau</h3>
                                <button
                                    onClick={() => router.push(`/supervisor-akademik/penerima/pratinjau?id=${letterId}`)}
                                    className="w-full bg-[#4ADE80] dark:bg-green-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-600 dark:hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                                        <path d="M2 8C2 8 4.5 3 8 3C11.5 3 14 8 14 8C14 8 11.5 13 8 13C4.5 13 2 8 2 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="8" cy="8" r="2" stroke="white" strokeWidth="1.5" />
                                    </svg>
                                    Lihat Pratinjau
                                </button>
                            </div> */}

                            {/* Tindakan Verifikasi or Edit Form */}
                            {isEditMode ? (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
                                    <h3 className="font-semibold mb-6 dark:text-white flex items-center gap-2">
                                        <Edit3 className="w-5 h-5 text-blue-500" />
                                        Edit Data Surat
                                    </h3>
                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Lengkap</label>
                                            <input
                                                type="text" value={nama} onChange={(e) => setNama(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">NIM</label>
                                            <input
                                                type="text" value={nim} onChange={(e) => setNim(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Jurusan</label>
                                            <input
                                                type="text" value={prodi} onChange={(e) => setProdi(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Semester</label>
                                                <input
                                                    type="text" value={semester} onChange={(e) => setSemester(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tahun Akademik</label>
                                                <input
                                                    type="text" value={tahunAkademik} onChange={(e) => setTahunAkademik(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tanggal Lahir</label>
                                            <input
                                                type="text" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="pt-2 border-t dark:border-gray-700 mt-2">
                                            <p className="text-xs font-bold text-gray-400 mb-3">DATA ORANG TUA / WALI</p>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Orang Tua</label>
                                                    <input
                                                        type="text" value={namaOrangTua} onChange={(e) => setNamaOrangTua(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">NIP / Pensiunan</label>
                                                    <input
                                                        type="text" value={nipPensiunan} onChange={(e) => setNipPensiunan(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Pangkat / Golongan</label>
                                                    <input
                                                        type="text" value={pangkat} onChange={(e) => setPangkat(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Instansi</label>
                                                    <input
                                                        type="text" value={instansi} onChange={(e) => setInstansi(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex flex-col gap-2">
                                        <button
                                            onClick={() => setShowSaveConfirm(true)}
                                            disabled={actionLoading}
                                            className="w-full bg-[#0EA5E9] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-600 transition flex items-center justify-center gap-2"
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                                            Simpan Perubahan
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={actionLoading}
                                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                canAction && (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
                                        <div className={`p-4 text-white flex items-center justify-between ${activeAction === 'reject' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                            activeAction === 'revision' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                                activeAction === 'approve' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                                    'bg-white dark:bg-gray-800 !text-gray-900 dark:!text-white border-b border-gray-100 dark:border-gray-700'
                                            }`}>
                                            <h3 className="font-bold flex items-center gap-2">
                                                <AlertCircle size={18} className={activeAction === 'none' ? 'text-blue-500' : ''} />
                                                {activeAction === 'none' ? 'Tindakan Verifikasi' :
                                                    activeAction === 'approve' ? 'Setujui Pengajuan' :
                                                        activeAction === 'revision' ? 'Minta Revisi' :
                                                            'Tolak Pengajuan'}
                                            </h3>
                                            {activeAction !== 'none' && (
                                                <button onClick={() => setActiveAction('none')} className="p-1 hover:bg-black/10 rounded-full transition">
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="p-5">
                                            {activeAction === 'none' ? (
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={() => setActiveAction('approve')}
                                                        className="w-full bg-[#4ADE80] dark:bg-green-500 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-green-600 dark:hover:bg-green-600 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Check size={18} />
                                                        Setujui
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditMode(true)}
                                                        className="w-full bg-[#3B82F6] dark:bg-blue-500 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <Edit3 size={18} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveAction('revision')}
                                                        className="w-full bg-[#FB923C] dark:bg-orange-500 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-orange-600 dark:hover:bg-orange-600 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <RotateCcw size={18} />
                                                        Revisi ke Mahasiswa
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveAction('reject')}
                                                        className="w-full bg-white dark:bg-gray-800 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-700 py-2.5 rounded-lg font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                                                    >
                                                        <X size={18} />
                                                        Tolak Pengajuan
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    {activeAction === 'revision' && (
                                                        <div className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
                                                            <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed font-medium">
                                                                Surat akan dikembalikan ke mahasiswa untuk diperbaiki. Pastikan Anda memberikan catatan yang jelas mengenai apa yang perlu direvisi.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {activeAction === 'approve' && (
                                                        <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                                                            <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed font-medium">
                                                                Dengan menyetujui, pengajuan ini akan diteruskan ke Manajer TU untuk tahap penandatanganan.
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="space-y-1.5">
                                                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
                                                            Catatan / Komentar {activeAction === 'approve' ? '(Opsional)' : '(Wajib)'}
                                                        </label>
                                                        <textarea
                                                            className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                                            placeholder={activeAction === 'reject' ? "Berikan alasan penolakan..." : activeAction === 'revision' ? "Berikan instruksi revisi..." : "Tambah catatan (opsional)..."}
                                                            value={actionComment}
                                                            onChange={(e) => setActionComment(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="flex gap-2 pt-2">
                                                        <button
                                                            onClick={() => setActiveAction('none')}
                                                            disabled={actionLoading}
                                                            className="flex-1 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                                        >
                                                            Batal
                                                        </button>
                                                        <button
                                                            onClick={handleAction}
                                                            disabled={actionLoading || ((activeAction === 'reject' || activeAction === 'revision') && !actionComment.trim())}
                                                            className={`flex-[2] px-4 py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-95 ${activeAction === 'reject' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                                                                activeAction === 'revision' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' :
                                                                    'bg-green-600 hover:bg-green-700 shadow-green-200'
                                                                }`}
                                                        >
                                                            {actionLoading && <Loader2 size={14} className="animate-spin" />}
                                                            Konfirmasi {activeAction === 'approve' ? 'Setujui' : activeAction === 'revision' ? 'Revisi' : 'Tolak'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Timeline Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Riwayat Proses</h3>
                                </div>
                                {letterId && <LetterTimeline letterId={letterId} role="sa" refreshKey={timelineRefreshKey} />}
                            </div>
                        </div>
                    </div>
                </main>
            </div>


            {/* Save Confirmation Modal */}
            {showSaveConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Konfirmasi Perubahan</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                Apakah Anda yakin ingin menyimpan perubahan pada data surat ini?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSaveConfirm(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSaveConfirm(false);
                                        handleSave();
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition shadow-lg shadow-blue-200 dark:shadow-none"
                                >
                                    Ya, Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function IdentitasPemohonPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
            <IdentitasPemohonContent />
        </Suspense>
    );
}
