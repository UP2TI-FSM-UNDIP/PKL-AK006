"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from '@/hooks/use-app-router'
import { useParams } from "next/navigation";
import TopBar from "@/components/layouts/TopBar";
import { SuperadminSidebar } from "@/components/layouts/SuperadminSidebar";
import {
  superadminApi,
  type LetterInstance,
  type TimelineStep,
  getStatusLabel,
  getStatusColor,
  getStepLabel,
  formatDate,
} from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Loader2,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  Eye,
  AlertCircle,
  X,
  ShieldAlert,
  Paperclip,
  PenTool,
} from "lucide-react";

import { LetterTimeline } from "@/components/letter/LetterTimeline";
import { AttachmentList } from "@/components/letter/AttachmentList";
import { ApplicantInfoCard } from "@/components/letter/details/ApplicantInfoCard";
import { LetterDetailsCard } from "@/components/letter/details/LetterDetailsCard";
import { ParentInfoCard } from "@/components/letter/details/ParentInfoCard";
import { LetterPreviewCard } from "@/components/letter/LetterPreviewCard";
import { useAK006Template } from "@/hooks/use-ak006-template";
import { sanitizeFileUrl } from "@/lib/helpers";

export default function SuperadminLetterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const letterId = params.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [letter, setLetter] = useState<LetterInstance | null>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [activeAction, setActiveAction] = useState<'none' | 'reject' | 'delete' | 'number'>('none');
  const [actionComment, setActionComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mtuSignatures, setMtuSignatures] = useState<any[]>([]);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [selectedSignatureUrl, setSelectedSignatureUrl] = useState<string>("");
  const [numberingData, setNumberingData] = useState({
    letterNumber: "",
    letterDate: new Date().toISOString().split('T')[0]
  });

  // Card expansion state
  const [expanded, setExpanded] = useState({
    applicant: true,
    details: true,
    parent: true,
    lampiran: true,
    preview: true,
  });

  const { templateConfig, loading: templateLoading } = useAK006Template(letter?.templateConfig);

  // Load letter data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check auth
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

        // Load letter
        const [letterRes, timelineRes] = await Promise.all([
          superadminApi.getLetterById(letterId),
          superadminApi.getLetterTimeline(letterId),
        ]);

        if (letterRes.success && letterRes.data) {
          setLetter(letterRes.data);
        } else {
          setError("Surat tidak ditemukan");
        }

        if (timelineRes.success && timelineRes.data) {
          setTimeline(timelineRes.data);
        }

        // Load MTU signatures
        try {
          setLoadingSignatures(true);
          setSignatureError(null);
          const signatureRes = await superadminApi.getMTUSignatures();
          console.log("MTU Signatures Result:", signatureRes);
          if (signatureRes.success && signatureRes.data) {
            setMtuSignatures(signatureRes.data);
            if (signatureRes.data.length === 0) {
              setSignatureError("Tidak ada tanda tangan MTU yang ditemukan di sistem.");
            }
          } else {
            setSignatureError(signatureRes.message || "Gagal memuat tanda tangan MTU");
          }
        } catch (sigErr) {
          console.error("Error loading MTU signatures:", sigErr);
          setSignatureError("Terjadi kesalahan saat memuat tanda tangan");
        } finally {
          setLoadingSignatures(false);
        }
      } catch (err) {
        console.error("Error loading letter:", err);
        setError("Gagal memuat data surat");
      } finally {
        setLoading(false);
      }
    };

    if (letterId) {
      loadData();
    }
  }, [letterId, router]);

  // Handle numbering (calls forceApproveLetter backend)
  const handleNumbering = async () => {
    if (!numberingData.letterNumber) return;
    try {
      setActionLoading(true);
      const res = await superadminApi.forceApproveLetter(letterId, {
        comments: actionComment || "Numbered by Superadmin",
        letterNumber: numberingData.letterNumber,
        letterDate: numberingData.letterDate,
        signatureUrl: selectedSignatureUrl || letter?.signatureUrl,
      });
      if (res.success && res.data) {
        setLetter(res.data);
        setActiveAction('none');
        setActionComment("");
        setNumberingData({
          letterNumber: "",
          letterDate: new Date().toISOString().split('T')[0]
        });
        setSelectedSignatureUrl("");
        setRefreshKey(prev => prev + 1);
      } else {
        console.error(res.message || "Gagal memproses penomoran");
      }
    } catch (err) {
      console.error("Error numbering:", err);
      console.error("Gagal memproses penomoran");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle force reject
  const handleForceReject = async () => {
    if (!actionComment.trim()) return;
    try {
      setActionLoading(true);
      const res = await superadminApi.forceRejectLetter(letterId, actionComment);
      if (res.success && res.data) {
        setLetter(res.data);
        setActiveAction('none');
        setActionComment("");
        setRefreshKey(prev => prev + 1);
      } else {
        console.error(res.message || "Gagal menolak surat");
      }
    } catch (err) {
      console.error("Error rejecting:", err);
      console.error("Gagal menolak surat");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const res = await superadminApi.deleteLetter(letterId);
      if (res.success) {
        router.push("/superadmin/letters");
      } else {
        console.error(res.message || "Gagal menghapus surat");
      }
    } catch (err) {
      console.error("Error deleting:", err);
      console.error("Gagal menghapus surat");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <TopBar role="Superadmin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">
              {error || "Surat tidak ditemukan"}
            </p>
            <button
              onClick={() => router.push("/superadmin/letters")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Kembali ke Daftar Surat
            </button>
          </div>
        </div>
      </div>
    );
  }

  const letterValues = letter.values as Record<string, any>;
  const canTakeAction = letter.status !== "COMPLETED" && letter.status !== "REJECTED";

  const getVal = (val: any) => {
    if (!val) return '-';
    if (typeof val === 'object') return val.name || val.nama || '-';
    return val;
  };

  const mappedData = {
    namaLengkap: getVal(letter.createdBy?.name),
    nim: getVal(letter.createdBy?.mahasiswa?.nim),
    email: getVal(letter.createdBy?.email),
    departemen: getVal(letter.createdBy?.mahasiswa?.departemen?.name),
    programStudi: getVal(letter.createdBy?.mahasiswa?.programStudi?.name),
    tempatLahir: getVal(letterValues?.tempat_lahir || letterValues?.tempatLahir),
    tanggalLahir: getVal(letterValues?.tanggal_lahir || letterValues?.tanggalLahir),
    noHP: getVal(letterValues?.no_hp || letterValues?.noHP),
    alamat: getVal(letterValues?.alamat),
    role: "Mahasiswa",
    jenisSurat: getVal(letter.letterType?.name),
    keperluan: getVal(letterValues?.keperluan),
    semester: getVal(letterValues?.semester),
    tahunAkademik: getVal(letterValues?.tahunAkademik || letterValues?.tahun_akademik),
    namaOrtuWali: getVal(letterValues?.nama_ortu_wali || letterValues?.namaOrtuWali),
    nipPensiunOrtuWali: getVal(letterValues?.nip_pensiun_ortu_wali || letterValues?.nipPensiunOrtuWali),
    golonganOrtuWali: getVal(letterValues?.golongan_ortu_wali || letterValues?.golonganOrtuWali || letterValues?.pangkatGolongan),
    instansiOrtuWali: getVal(letterValues?.instansi_ortu_wali || letterValues?.instansiOrtuWali),
  };

  const templateData = letter ? {
    nama_lengkap: letter.createdBy?.name || '-',
    role: "Mahasiswa",
    nim: letter.createdBy?.mahasiswa?.nim || '-',
    email: letter.createdBy?.email || '-',
    departemen: letter.createdBy?.mahasiswa?.departemen?.name || '-',
    program_studi: letter.createdBy?.mahasiswa?.programStudi?.name || '-',
    tempat_lahir: letterValues?.tempat_lahir || '-',
    tanggal_lahir: letterValues?.tanggal_lahir || '-',
    no_hp: letterValues?.no_hp || '-',
    alamat: letterValues?.alamat || '-',
    jenis_surat: letter.letterType?.name || 'Surat Keterangan Masih Kuliah',
    keperluan_surat: letterValues?.keperluan || '-',
    nama_ortu_wali: letterValues?.nama_ortu_wali || '-',
    nip_pensiun_ortu_wali: letterValues?.nip_pensiun_ortu_wali || '-',
    golongan_ortu_wali: letterValues?.golongan_ortu_wali || '-',
    instansi_ortu_wali: letterValues?.instansi_ortu_wali || '-',
    semester: letterValues?.semester,
    tahun_akademik: letterValues?.tahunAkademik || letterValues?.tahun_akademik,
    attachments: { mandatory: [], optional: [] }
  } : null;

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900 transition-colors duration-300">
      <TopBar role="Superadmin" onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <SuperadminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 lg:px-24 pb-24">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <button
                onClick={() => router.push('/superadmin/letters')}
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
                letterNumber={activeAction === 'number' ? numberingData.letterNumber : letter?.letterNumber}
                letterDate={activeAction === 'number' ? numberingData.letterDate : (letter?.archivedAt || letter?.updatedAt || letter?.createdAt)}
                signatureUrl={activeAction === 'number' ? (selectedSignatureUrl || letter?.signatureUrl) : letter?.signatureUrl}
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
              {/* Tindakan Superadmin Card */}
              {canTakeAction && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
                  <div className={`p-4 text-white flex items-center justify-between ${activeAction === 'reject' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    activeAction === 'delete' ? 'bg-gradient-to-r from-gray-600 to-gray-700' :
                      activeAction === 'number' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                        'bg-white dark:bg-gray-800 !text-gray-900 dark:!text-white border-b border-gray-100 dark:border-gray-700'
                    }`}>
                    <h3 className="font-bold flex items-center gap-2">
                      <ShieldAlert size={18} className={activeAction === 'none' ? 'text-purple-500' : ''} />
                      {activeAction === 'none' ? 'Tindakan Superadmin' :
                        activeAction === 'reject' ? 'Force Reject' :
                          activeAction === 'number' ? 'Force Approved' :
                            'Hapus Pengajuan'}
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
                          onClick={() => setActiveAction('number')}
                          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                        >
                          <PenTool size={18} />
                          Force Approve
                        </button>
                        <button
                          onClick={() => setActiveAction('reject')}
                          className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-orange-700 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                        >
                          <XCircle size={18} />
                          Force Reject
                        </button>
                        <button
                          onClick={() => setActiveAction('delete')}
                          className="w-full bg-white dark:bg-gray-800 text-red-500 border border-red-200 dark:border-red-700 py-2.5 rounded-lg font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                        >
                          <Trash2 size={18} />
                          Hapus Pengajuan
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeAction === 'delete' ? (
                          <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed font-medium">
                              Apakah Anda yakin ingin menghapus surat ini? Tindakan ini tidak dapat dibatalkan.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {activeAction === 'number' && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Nomor Surat</label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Contoh: 123/UN7.F4/AK/2026"
                                    value={numberingData.letterNumber}
                                    onChange={(e) => setNumberingData({ ...numberingData, letterNumber: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Tanggal Surat</label>
                                  <input
                                    type="date"
                                    className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={numberingData.letterDate}
                                    onChange={(e) => setNumberingData({ ...numberingData, letterDate: e.target.value })}
                                  />
                                </div>

                                <div className="pt-2">
                                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Tanda Tangan (MTU)</label>
                                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loadingSignatures ? (
                                      <div className="flex items-center gap-2 py-4 justify-center">
                                        <Loader2 size={16} className="animate-spin text-purple-600" />
                                        <span className="text-xs text-gray-500">Memuat Tanda Tangan...</span>
                                      </div>
                                    ) : signatureError ? (
                                      <div className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-lg">
                                        <p className="text-[10px] text-orange-700 dark:text-orange-400 font-medium">
                                          {signatureError}
                                        </p>
                                      </div>
                                    ) : mtuSignatures.length > 0 ? (
                                      mtuSignatures.map((sig) => (
                                        <button
                                          key={sig.id}
                                          onClick={() => setSelectedSignatureUrl(sig.imageUrl)}
                                          className={`relative flex flex-col p-3 rounded-xl border text-center transition-all ${selectedSignatureUrl === sig.imageUrl
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                          <div className="w-full h-28 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-2 mb-3 shadow-inner">
                                            <img src={sanitizeFileUrl(sig.imageUrl)} alt="TTD" className="max-w-full max-h-full object-contain" />
                                          </div>
                                          <div className="w-full">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                              {sig.user?.name}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                              {sig.user?.pegawai?.jabatan || 'Manajer TU'}
                                            </p>
                                          </div>
                                          {selectedSignatureUrl === sig.imageUrl && (
                                            <div className="absolute top-2 right-2 text-purple-600 bg-white rounded-full shadow-sm">
                                              <CheckCircle size={20} />
                                            </div>
                                          )}
                                        </button>
                                      ))
                                    ) : (
                                      <p className="text-[10px] text-gray-500 italic">Tidak ada tanda tangan MTU yang tersedia</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
                                Catatan / Alasan {activeAction === 'number' ? '(Opsional)' : '(Wajib)'}
                              </label>
                              <textarea
                                className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm min-h-[80px] focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
                                placeholder={activeAction === 'reject' ? "Berikan alasan penolakan..." : "Berikan catatan Force Approved..."}
                                value={actionComment}
                                onChange={(e) => setActionComment(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setActiveAction('none')}
                            disabled={actionLoading}
                            className="flex-1 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                          >
                            Batal
                          </button>
                          <button
                            onClick={activeAction === 'number' ? handleNumbering :
                              activeAction === 'reject' ? handleForceReject :
                                handleDelete}
                            disabled={actionLoading || (activeAction === 'number' && (!numberingData.letterNumber || (!selectedSignatureUrl && !letter?.signatureUrl))) || (activeAction !== 'delete' && activeAction !== 'number' && !actionComment.trim())}
                            className={`flex-[2] px-4 py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-95 ${activeAction === 'reject' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' :
                              activeAction === 'number' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' :
                                'bg-red-600 hover:bg-red-700 shadow-red-200'
                              }`}
                          >
                            {actionLoading && <Loader2 size={14} className="animate-spin" />}
                            Konfirmasi {activeAction === 'reject' ? 'Reject' : activeAction === 'number' ? 'Force Approve' : 'Hapus'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all duration-300">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Riwayat Proses</h3>
                </div>
                {letterId && <LetterTimeline letterId={letterId} role="superadmin" refreshKey={refreshKey} />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
