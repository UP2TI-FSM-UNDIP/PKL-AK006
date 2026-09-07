"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from '@/hooks/use-app-router'
import { useParams } from "next/navigation";
import TopBar from "@/components/layouts/TopBar";
import { AppSidebar } from "@/components/layouts/SideBar";
import PageWrapper from "@/components/layouts/PageWrapper";
import HeaderPage from "@/components/ui/PageHeader";
import {
    letterApi,
    userApi,
    type LetterInstance,
    type UserProfile,
    getStatusLabel,
    getStatusColor,
    getStepLabel
} from "@/lib/api";
import { Loader2, X, Check, ArrowLeft, AlertCircle, FileText, User, Users, Paperclip, Clock, PenTool } from "lucide-react";
import { LetterTimeline } from "@/components/letter/LetterTimeline";
import { AttachmentList } from "@/components/letter/AttachmentList";
import { ApplicantInfoCard } from "@/components/letter/details/ApplicantInfoCard";
import { LetterDetailsCard } from "@/components/letter/details/LetterDetailsCard";
import { ParentInfoCard } from "@/components/letter/details/ParentInfoCard";

function DetailSuratPageContent() {
    const router = useRouter();
    const params = useParams();
    const letterId = params.id as string;

    const [letter, setLetter] = useState<LetterInstance | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

    // Action Modals State
    const [showActionModal, setShowActionModal] = useState<{
        show: boolean;
        type: 'approve' | 'reject' | 'revision' | 'sign' | 'finalize';
    }>({ show: false, type: 'approve' });
    const [actionComment, setActionComment] = useState("");
    const [finalizeData, setFinalizeData] = useState({ letterNumber: "" });
    const [revisionTarget, setRevisionTarget] = useState<number>(0);

    // Card expansion state
    const [expanded, setExpanded] = useState({
        applicant: true,
        details: true,
        parent: true
    });

    useEffect(() => {
        const loadData = async () => {
            if (!letterId) return;
            try {
                setIsLoading(true);

                // Fetch profile first to determine role
                const userRes = await userApi.getProfile();
                let userProfile = null;
                if (userRes.success && userRes.data) {
                    userProfile = userRes.data;
                    setUser(userRes.data);
                }

                // Determine which API to use based on role
                let letterRes;
                const roles = userProfile?.roles.map(r => r.toLowerCase()) || [];

                if (roles.includes('supervisor akademik') || roles.includes('supervisor_akademik')) {
                    letterRes = await letterApi.getSALetterById(letterId);
                } else if (roles.includes('manajer tu') || roles.includes('manager_tu')) {
                    letterRes = await letterApi.getMTULetterById(letterId);
                } else if (roles.includes('upa')) {
                    letterRes = await letterApi.getUPALetterById(letterId);
                } else {
                    // Fallback to generic for Mahasiswa/others
                    letterRes = await letterApi.getLetterById(letterId);
                }

                if (letterRes.success && letterRes.data) {
                    setLetter(letterRes.data);
                } else {
                    setError(letterRes.message || "Gagal memuat data surat");
                }
            } catch (err) {
                console.error("Error loading detail:", err);
                setError("Terjadi kesalahan teknis");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [letterId]);

    const handleAction = async () => {
        if (!letter) return;
        setActionLoading(true);
        try {
            let res;
            const type = showActionModal.type;

            if (user?.roles.some(r => r.toLowerCase() === 'supervisor akademik' || r.toLowerCase() === 'supervisor_akademik')) {
                if (type === 'approve' || type === 'reject' || type === 'revision') {
                    res = await letterApi.verifyLetter(letter.id, type, actionComment);
                }
            } else if (user?.roles.some(r => r.toLowerCase() === 'manajer tu' || r.toLowerCase() === 'manager_tu')) {
                if (type === 'sign') {
                    res = await letterApi.signLetter(letter.id, undefined, undefined, actionComment);
                } else if (type === 'reject') {
                    res = await letterApi.rejectLetterMTU(letter.id, actionComment);
                } else if (type === 'revision') {
                    res = await letterApi.reviseLetterMTU(letter.id, actionComment, revisionTarget);
                }
            } else if (user?.roles.some(r => r.toLowerCase() === 'upa')) {
                if (type === 'finalize') {
                    res = await letterApi.finalizeLetter(letter.id, { letterNumber: finalizeData.letterNumber, comments: actionComment });
                } else if (type === 'reject') {
                    res = await letterApi.rejectLetterUPA(letter.id, actionComment);
                } else if (type === 'revision') {
                    res = await letterApi.reviseLetterUPA(letter.id, actionComment, revisionTarget);
                }
            }

            if (res?.success && res.data) {
                setLetter(res.data);
                setShowActionModal({ show: false, type: 'approve' });
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-500">Memuat detail surat...</p>
                </div>
            </div>
        );
    }

    if (error || !letter) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
                <TopBar role="Verifikator" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "Surat tidak ditemukan"}</p>
                        <button onClick={() => router.back()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isSA = user?.roles.some(r => r.toLowerCase() === 'supervisor akademik' || r.toLowerCase() === 'supervisor_akademik');
    const isMTU = user?.roles.some(r => r.toLowerCase() === 'manajer tu' || r.toLowerCase() === 'manager_tu');
    const isUPA = user?.roles.some(r => r.toLowerCase() === 'upa');

    const getSidebarRole = () => {
        if (!user) return 'mahasiswa';
        const roles = user.roles.map(r => r.toLowerCase());
        if (roles.includes('supervisor akademik') || roles.includes('supervisor_akademik')) return 'supervisor-akademik';
        if (roles.includes('manajer tu') || roles.includes('manager_tu')) return 'manajer-tu';
        if (roles.includes('upa')) return 'upa';
        return 'mahasiswa';
    };

    const canAction = (isSA && letter.currentStep === 1 && letter.status === 'PENDING') ||
        (isMTU && letter.currentStep === 2 && letter.status === 'PENDING') ||
        (isUPA && letter.currentStep === 3 && letter.status === 'PENDING');

    const getVal = (val: any) => {
        if (!val) return '-';
        if (typeof val === 'object') return val.name || val.nama || '-';
        return val;
    };

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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <TopBar role={isSA ? "Supervisor Akademik" : isMTU ? "Manajer TU" : isUPA ? "UPA" : "User"} onMenuClick={() => setSidebarOpen(true)} />

            <div className="flex flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <AppSidebar role={getSidebarRole()} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <main className="flex-1 p-4 lg:p-8 lg:px-24 pb-24">
                    <div className="max-w-7xl mx-auto">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <button
                                    onClick={() => router.back()}
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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Data */}
                            <div className="lg:col-span-2 space-y-6">
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

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Paperclip className="w-5 h-5 text-blue-500" />
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lampiran</h2>
                                    </div>
                                    <AttachmentList attachments={letter.attachments} />
                                </div>
                            </div>

                            {/* Right Column: Timeline & Actions */}
                            <div className="space-y-6">
                                {/* Actions Card */}
                                {canAction && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-t-4 border-blue-500 p-6 sticky top-24">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <PenTool className="w-5 h-5 text-blue-500" />
                                            Tindakan Verifikasi
                                        </h3>
                                        <div className="space-y-3">
                                            {isSA && (
                                                <>
                                                    <button
                                                        onClick={() => setShowActionModal({ show: true, type: 'approve' })}
                                                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                                                    >
                                                        <Check size={18} /> Setujui
                                                    </button>
                                                    <button
                                                        onClick={() => setShowActionModal({ show: true, type: 'revision' })}
                                                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                                                    >
                                                        <Clock size={18} /> Beri Catatan Revisi
                                                    </button>
                                                </>
                                            )}
                                            {isMTU && (
                                                <>
                                                    <button
                                                        onClick={() => setShowActionModal({ show: true, type: 'sign' })}
                                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                                                    >
                                                        <PenTool size={18} /> Tanda Tangani
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setRevisionTarget(1);
                                                            setShowActionModal({ show: true, type: 'revision' });
                                                        }}
                                                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                                                    >
                                                        <Clock size={18} /> Kembalikan ke SA
                                                    </button>
                                                </>
                                            )}
                                            {isUPA && (
                                                <>
                                                    <button
                                                        onClick={() => setShowActionModal({ show: true, type: 'finalize' })}
                                                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                                                    >
                                                        <Check size={18} /> Finalisasi & Beri Nomor
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setRevisionTarget(2);
                                                            setShowActionModal({ show: true, type: 'revision' });
                                                        }}
                                                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                                                    >
                                                        <Clock size={18} /> Kembalikan ke MTU
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setShowActionModal({ show: true, type: 'reject' })}
                                                className="w-full py-2.5 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                                            >
                                                <X size={18} /> Tolak Pengajuan
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Timeline Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Clock className="w-5 h-5 text-blue-500" />
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Riwayat Proses</h3>
                                    </div>
                                    <LetterTimeline letterId={letterId} role={isSA ? 'sa' : isMTU ? 'mtu' : isUPA ? 'upa' : 'mahasiswa'} refreshKey={timelineRefreshKey} />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Action Modal */}
            {showActionModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className={`p-6 text-white bg-gradient-to-r ${showActionModal.type === 'reject' ? 'from-red-500 to-red-600' :
                            showActionModal.type === 'revision' ? 'from-orange-500 to-orange-600' :
                                'from-blue-500 to-blue-600'
                            }`}>
                            <h3 className="text-xl font-bold capitalize">Konfirmasi {showActionModal.type === 'sign' ? 'Tanda Tangan' : showActionModal.type === 'finalize' ? 'Finalisasi' : showActionModal.type === 'revision' ? 'Revisi' : showActionModal.type}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {showActionModal.type === 'finalize' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nomor Surat (UPA)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                        placeholder="Contoh: 123/UN7.F4/AK/2026"
                                        value={finalizeData.letterNumber}
                                        onChange={(e) => setFinalizeData({ ...finalizeData, letterNumber: e.target.value })}
                                    />
                                </div>
                            )}
                            {showActionModal.type === 'revision' && isMTU && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">Surat akan dikembalikan ke Supervisor Akademik untuk diperiksa ulang.</p>
                            )}
                            {showActionModal.type === 'revision' && isUPA && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">Surat akan dikembalikan ke Manajer TU untuk diperiksa ulang.</p>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan / Komentar</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 dark:bg-gray-900 dark:text-white min-h-[100px]"
                                    placeholder="Berikan alasan atau detail tambahan..."
                                    value={actionComment}
                                    onChange={(e) => setActionComment(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    onClick={() => setShowActionModal({ show: false, type: 'approve' })}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAction}
                                    disabled={actionLoading}
                                    className={`px-6 py-2 rounded-lg text-white font-bold flex items-center gap-2 transition ${showActionModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                        showActionModal.type === 'revision' ? 'bg-orange-600 hover:bg-orange-700' :
                                            'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {actionLoading && <Loader2 size={16} className="animate-spin" />}
                                    Konfirmasi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DetailSuratPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin" /></div>}>
            <DetailSuratPageContent />
        </Suspense>
    );
}
