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
import { Loader2, X, ArrowLeft, AlertCircle, Paperclip, Clock, PenTool, Eye, RotateCcw } from "lucide-react";
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
	const [activeAction, setActiveAction] = useState<'none' | 'finalize' | 'reject' | 'revision'>('none');
	const [actionComment, setActionComment] = useState("");
	const [revisionTarget, setRevisionTarget] = useState<number>(2);
	const [finalizeData, setFinalizeData] = useState({
		letterNumber: "",
		letterDate: new Date().toISOString().split('T')[0]
	});

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

	// Handle UPA actions
	const handleAction = async () => {
		if (!letter) return;
		setActionLoading(true);
		try {
			let res;
			const type = activeAction;

			if (type === 'finalize') {
				res = await letterApi.finalizeLetter(letter.id, {
					letterNumber: finalizeData.letterNumber,
					letterDate: finalizeData.letterDate,
					comments: actionComment
				});
			} else if (type === 'reject') {
				res = await letterApi.rejectLetterUPA(letter.id, actionComment);
			} else if (type === 'revision') {
				res = await letterApi.reviseLetterUPA(letter.id, actionComment, revisionTarget);
			}

			if (res?.success && res.data) {
				setLetter(res.data);
				setActiveAction('none');
				setActionComment("");
				setFinalizeData({
					letterNumber: "",
					letterDate: new Date().toISOString().split('T')[0]
				});
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

	const getVal = (val: any) => {
		if (!val) return '-';
		if (typeof val === 'object') return val.name || val.nama || '-';
		return val;
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
				<TopBar role="UPA" />
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
				<TopBar role="UPA" />
				<div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
					<div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
						<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
						<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
						<p className="text-gray-500 dark:text-gray-400 mb-6">{error || "Surat tidak ditemukan"}</p>
						<button onClick={() => router.push('/upa/dashboard')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
							Kembali ke Dashboard
						</button>
					</div>
				</div>
			</div>
		);
	}

	const canAction = letter.currentStep === 3 && (letter.status === 'PENDING' || letter.status === 'IN_PROGRESS');

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
	} : null;

	return (
		<div className="min-h-screen flex flex-col dark:bg-gray-900 transition-colors duration-300">
			<TopBar role="UPA" onMenuClick={() => setSidebarOpen(true)} />

			<div className="flex flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
				<AppSidebar role="upa" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

				{/* Main Content */}
				<main className="flex-1 p-4 lg:p-8 lg:px-24 pb-24">
					{/* Header Section */}
					<div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
						<div>
							<button
								onClick={() => router.push('/upa/dashboard')}
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
								letterNumber={finalizeData.letterNumber || letter?.letterNumber}
								letterDate={finalizeData.letterDate || letter?.archivedAt || letter?.updatedAt || letter?.createdAt}
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
							{/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
								<h3 className="font-semibold mb-4 dark:text-white flex items-center gap-2">
									<Eye className="w-5 h-5 text-blue-500" />
									Lihat Pratinjau
								</h3>
								<button
									onClick={() => router.push(`/upa/penerima/pratinjau?id=${letterId}`)}
									className="w-full bg-[#4ADE80] dark:bg-green-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-600 dark:hover:bg-green-600 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-green-200 dark:shadow-none"
								>
									<Eye size={16} />
									Lihat Pratinjau
								</button>
							</div> */}

							{/* Tindakan Verifikasi Card */}
							{canAction && (
								<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
									<div className={`p-4 text-white flex items-center justify-between ${activeAction === 'reject' ? 'bg-gradient-to-r from-red-500 to-red-600' :
										activeAction === 'revision' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
											activeAction === 'finalize' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
												'bg-white dark:bg-gray-800 !text-gray-900 dark:!text-white border-b border-gray-100 dark:border-gray-700'
										}`}>
										<h3 className="font-bold flex items-center gap-2">
											<AlertCircle size={18} className={activeAction === 'none' ? 'text-blue-500' : ''} />
											{activeAction === 'none' ? 'Tindakan Verifikasi' : 'Penomoran Surat'}
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
													onClick={() => setActiveAction('finalize')}
													className="w-full bg-[#0EA5E9] dark:bg-blue-500 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-blue-600 dark:hover:bg-blue-600 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
												>
													<PenTool size={18} />
													Beri Nomor Surat
												</button>
											</div>
										) : (
											<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
												{activeAction === 'finalize' && (
													<>
														<div className="space-y-4">
															<div>
																<label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Nomor Surat</label>
																<input
																	type="text"
																	className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
																	placeholder="Contoh: 123/UN7.F4/AK/2026"
																	value={finalizeData.letterNumber}
																	onChange={(e) => setFinalizeData({ ...finalizeData, letterNumber: e.target.value })}
																/>
															</div>
															<div>
																<label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Tanggal Surat</label>
																<input
																	type="date"
																	className="w-full px-3 py-2 text-sm border dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
																	value={finalizeData.letterDate}
																	onChange={(e) => setFinalizeData({ ...finalizeData, letterDate: e.target.value })}
																/>
															</div>
														</div>
													</>
												)}

												{activeAction === 'revision' && (
													<div className="space-y-3">
														<p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed font-medium">
															Surat akan dikembalikan ke Manajer TU untuk diperiksa ulang. Pastikan Anda memberikan catatan yang jelas.
														</p>
													</div>
												)}

												<div className="space-y-1.5">
													<label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
														Catatan / Komentar {activeAction === 'finalize' ? '(Opsional)' : '(Wajib)'}
													</label>
													<textarea
														className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm min-h-[80px] focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
														placeholder="Berikan alasan atau detail tambahan..."
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
														disabled={actionLoading || (activeAction === 'finalize' && !finalizeData.letterNumber) || ((activeAction === 'reject' || activeAction === 'revision') && !actionComment.trim())}
														className={`flex-[2] px-4 py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-95 ${activeAction === 'reject' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
															activeAction === 'revision' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' :
																'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
															}`}
													>
														{actionLoading && <Loader2 size={14} className="animate-spin" />}
														Konfirmasi {activeAction === 'finalize' ? 'Terbitkan' : activeAction === 'revision' ? 'Revisi' : 'Tolak'}
													</button>
												</div>
											</div>
										)}
									</div>
								</div>
							)}



							{/* Timeline Card */}
							<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
								<div className="flex items-center gap-2 mb-6">
									<Clock className="w-5 h-5 text-blue-500" />
									<h3 className="text-lg font-bold text-gray-900 dark:text-white">Riwayat Proses</h3>
								</div>
								{letterId && <LetterTimeline letterId={letterId} role="upa" refreshKey={timelineRefreshKey} />}
							</div>
						</div>
					</div>
				</main>
			</div>

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
