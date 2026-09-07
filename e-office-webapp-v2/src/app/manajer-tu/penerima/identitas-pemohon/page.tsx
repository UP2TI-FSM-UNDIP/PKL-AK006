"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "../../../../components/layouts/SideBar";
import TopBar from "@/components/layouts/TopBar";
import {
	letterApi,
	signatureApi,
	type LetterInstance,
	getStatusLabel,
	getStatusColor,
	getStepLabel
} from "@/lib/api";
import { Loader2, X, Check, ArrowLeft, AlertCircle, Paperclip, Clock, PenTool, Upload, Archive, Trash2, Palette, Image as ImageIcon, Save, RotateCcw } from "lucide-react";
import { LetterTimeline } from "@/components/letter/LetterTimeline";
import { AttachmentList } from "@/components/letter/AttachmentList";
import { ApplicantInfoCard } from "@/components/letter/details/ApplicantInfoCard";
import { LetterDetailsCard } from "@/components/letter/details/LetterDetailsCard";
import { ParentInfoCard } from "@/components/letter/details/ParentInfoCard";
import { LetterPreviewCard } from "@/components/letter/LetterPreviewCard";
import { useAK006Template } from "@/hooks/use-ak006-template";
import { sanitizeFileUrl } from "@/lib/helpers";

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
	const [activeAction, setActiveAction] = useState<'none' | 'sign' | 'reject' | 'revision' | 'forward'>('none');
	const [actionComment, setActionComment] = useState("");
	const [revisionTarget, setRevisionTarget] = useState<number>(1);

	// Signature states
	const [signatureMode, setSignatureMode] = useState<'draw' | 'upload' | 'saved'>('draw');
	const [savedSignatures, setSavedSignatures] = useState<any[]>([]);
	const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [uploadPreview, setUploadPreview] = useState<string | null>(null);
	const [isCanvasDirty, setIsCanvasDirty] = useState(false);
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [saveToProfile, setSaveToProfile] = useState(false);

	// Fetch saved signatures when inline signing starts
	useEffect(() => {
		if (activeAction === 'sign') {
			const fetchSigs = async () => {
				const res = await signatureApi.getMySignatures();
				if (res.success && res.data) {
					setSavedSignatures(res.data);
					const defaultSig = res.data.find((s: any) => s.isDefault);
					if (defaultSig) setSelectedSavedId(defaultSig.id);
					else if (res.data.length > 0) setSelectedSavedId(res.data[0].id);
				}
			};
			fetchSigs();
		}
	}, [activeAction]);

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
				const response = await letterApi.getMTULetterById(letterId);

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

	// Handle MTU actions
	const handleAction = async () => {
		if (!letter) return;
		setActionLoading(true);
		try {
			let res;
			const type = activeAction;

			if (type === 'sign') {
				let signatureId: string | undefined;
				let signatureUrl: string | undefined;

				if (signatureMode === 'draw') {
					if (!isCanvasDirty || !canvasRef.current) {
						alert("Mohon gambar tanda tangan terlebih dahulu");
						setActionLoading(false);
						return;
					}
					// Convert canvas to blob then file
					const dataUrl = canvasRef.current.toDataURL('image/png');
					const blob = await (await fetch(dataUrl)).blob();
					const file = new File([blob], 'signature.png', { type: 'image/png' });
					const uploadRes = await letterApi.uploadFile(file, 'signature');
					if (uploadRes.success && uploadRes.data) {
						const url = uploadRes.data.url;
						signatureUrl = url;
						// Save to profile only if checked
						if (saveToProfile) {
							await signatureApi.createSignature(url, false);
						}
					} else {
						throw new Error(uploadRes.message || "Gagal mengunggah tanda tangan");
					}
				} else if (signatureMode === 'upload') {
					if (!uploadedFile) {
						alert("Mohon unggah file tanda tangan terlebih dahulu");
						setActionLoading(false);
						return;
					}
					const uploadRes = await letterApi.uploadFile(uploadedFile, 'signature');
					if (uploadRes.success && uploadRes.data) {
						const url = uploadRes.data.url;
						signatureUrl = url;
						if (saveToProfile) {
							await signatureApi.createSignature(url, false);
						}
					} else {
						throw new Error(uploadRes.message || "Gagal mengunggah tanda tangan");
					}
				} else if (signatureMode === 'saved' && selectedSavedId) {
					const sig = savedSignatures.find(s => s.id === selectedSavedId);
					if (sig) {
						signatureId = sig.id;
						signatureUrl = sig.imageUrl;
					}
				}

				if (!signatureUrl && !signatureId) {
					alert("Mohon berikan tanda tangan terlebih dahulu");
					setActionLoading(false);
					return;
				}

				res = await letterApi.signLetter(letter.id, signatureId, signatureUrl, actionComment);
			} else if (type === 'reject') {
				res = await letterApi.rejectLetterMTU(letter.id, actionComment);
			} else if (type === 'revision') {
				res = await letterApi.reviseLetterMTU(letter.id, actionComment, revisionTarget);
			} else if (type === 'forward') {
				res = await letterApi.forwardLetterMTU(letter.id, actionComment);
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

	const handleDeleteSignature = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!confirm("Hapus tanda tangan ini dari profil Anda?")) return;
		try {
			const res = await signatureApi.deleteSignature(id);
			if (res.success) {
				setSavedSignatures(prev => prev.filter(s => s.id !== id));
				if (selectedSavedId === id) setSelectedSavedId(null);
			} else {
				alert(res.message || "Gagal menghapus tanda tangan");
			}
		} catch (err) {
			console.error("Delete signature error:", err);
			alert("Terjadi kesalahan sistem");
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
				<TopBar role="Manajer TU" />
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
				<TopBar role="Manajer TU" />
				<div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
					<div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
						<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
						<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
						<p className="text-gray-500 dark:text-gray-400 mb-6">{error || "Surat tidak ditemukan"}</p>
						<button onClick={() => router.push('/manajer-tu/dashboard-persuratan')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
							Kembali ke Dashboard
						</button>
					</div>
				</div>
			</div>
		);
	}

	const canAction = letter.currentStep === 2 && (letter.status === 'PENDING' || letter.status === 'IN_PROGRESS');

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
			<TopBar role="Manajer TU" onMenuClick={() => setSidebarOpen(true)} />

			<div className="flex flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
				<AppSidebar role="manajer-tu" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

				{/* Main Content */}
				<main className="flex-1 p-4 lg:p-8 lg:px-24 pb-24">
					{/* Header Section */}
					<div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
						<div>
							<button
								onClick={() => router.push('/manajer-tu/dashboard-persuratan')}
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
									onClick={() => router.push(`/manajer-tu/penerima/pratinjau?id=${letterId}`)}
									className="w-full bg-[#4ADE80] dark:bg-green-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-600 dark:hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
								>
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
										<path d="M2 8C2 8 4.5 3 8 3C11.5 3 14 8 14 8C14 8 11.5 13 8 13C4.5 13 2 8 2 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										<circle cx="8" cy="8" r="2" stroke="white" strokeWidth="1.5" />
									</svg>
									Lihat Pratinjau
								</button>
							</div> */}

							{/* Tindakan Verifikasi Card */}
							{canAction && (
								<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
									<div className={`p-4 text-white flex items-center justify-between ${activeAction === 'reject' ? 'bg-gradient-to-r from-red-500 to-red-600' :
										activeAction === 'revision' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
											activeAction === 'forward' ? 'bg-gradient-to-r from-green-600 to-emerald-600' :
												activeAction === 'sign' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
													'bg-white dark:bg-gray-800 !text-gray-900 dark:!text-white border-b border-gray-100 dark:border-gray-700'
										}`}>
										<h3 className="font-bold flex items-center gap-2">
											<PenTool size={18} className={activeAction === 'none' ? 'text-blue-500' : ''} />
											{activeAction === 'none' ? 'Tindakan Verifikasi' :
												activeAction === 'sign' ? 'Berikan Tanda Tangan' :
													activeAction === 'revision' ? 'Minta Revisi' :
														activeAction === 'reject' ? 'Tolak Pengajuan' :
															'Kirim ke UPA'}
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
												{/* Main Actions */}
												<button
													onClick={() => setActiveAction('sign')}
													className="w-full bg-[#4ADE80] dark:bg-green-500 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-green-600 dark:hover:bg-green-600 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
												>
													<PenTool size={18} />
													{letter.signatureUrl ? 'Ubah Tanda Tangan' : 'Tanda Tangan'}
												</button>

												{/* Forward to UPA Button - Always visible, enabled only if signed */}
												<button
													onClick={() => setActiveAction('forward')}
													disabled={!letter.signatureUrl}
													className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-md active:translate-y-0 ${letter.signatureUrl
														? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5'
														: 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
														}`}
												>
													<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={letter.signatureUrl ? "animate-pulse" : ""}>
														<path d="m22 2-7 20-4-9-9-4Z" />
														<path d="M22 2 11 13" />
													</svg>
													Kirim ke UPA
												</button>

												<button
													onClick={() => {
														setRevisionTarget(1);
														setActiveAction('revision');
													}}
													className="w-full bg-[#FB923C] dark:bg-orange-500 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-orange-600 dark:hover:bg-orange-600 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
												>
													<RotateCcw size={18} />
													Revisi
												</button>

												<button
													onClick={() => setActiveAction('reject')}
													className="w-full bg-white dark:bg-gray-800 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-700 py-2.5 rounded-lg font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
												>
													<Trash2 size={18} />
													Tolak Pengajuan
												</button>
											</div>
										) : (
											<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
												{activeAction === 'sign' && (
													<div className="space-y-4">
														{/* Signature Tabs */}
														<div className="flex border-b dark:border-gray-700">
															<button
																onClick={() => setSignatureMode('draw')}
																className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${signatureMode === 'draw' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
															>
																<PenTool size={14} />
																<span>Gambar</span>
															</button>
															<button
																onClick={() => setSignatureMode('upload')}
																className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${signatureMode === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
															>
																<Upload size={14} />
																<span>Upload</span>
															</button>
															<button
																onClick={() => setSignatureMode('saved')}
																className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${signatureMode === 'saved' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
															>
																<Archive size={14} />
																<span>Tersimpan</span>
															</button>
														</div>

														<div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 min-h-[180px] flex flex-col">
															{signatureMode === 'draw' && (
																<div className="flex-1 flex flex-col gap-2">
																	<div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded relative overflow-hidden group min-h-[140px]">
																		<canvas
																			ref={canvasRef}
																			width={400}
																			height={180}
																			className="w-full h-full cursor-crosshair touch-none"
																			onMouseDown={(e) => {
																				const canvas = canvasRef.current;
																				if (!canvas) return;
																				const ctx = canvas.getContext('2d');
																				if (!ctx) return;
																				setIsDrawing(true);
																				const rect = canvas.getBoundingClientRect();
																				const scaleX = canvas.width / rect.width;
																				const scaleY = canvas.height / rect.height;
																				ctx.beginPath();
																				ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
																			}}
																			onMouseMove={(e) => {
																				if (!isDrawing) return;
																				const canvas = canvasRef.current;
																				if (!canvas) return;
																				const ctx = canvas.getContext('2d');
																				if (!ctx) return;
																				const rect = canvas.getBoundingClientRect();
																				const scaleX = canvas.width / rect.width;
																				const scaleY = canvas.height / rect.height;
																				ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
																				ctx.stroke();
																				if (!isCanvasDirty) setIsCanvasDirty(true);
																			}}
																			onMouseUp={() => setIsDrawing(false)}
																			onMouseLeave={() => setIsDrawing(false)}
																		/>
																	</div>
																	<div className="flex justify-between items-center">
																		<div className="flex items-center gap-2">
																			<input
																				type="checkbox"
																				id="save-draw"
																				checked={saveToProfile}
																				onChange={(e) => setSaveToProfile(e.target.checked)}
																				className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
																			/>
																			<label htmlFor="save-draw" className="text-[10px] font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
																				Simpan ke Profil
																			</label>
																		</div>
																		<button
																			onClick={() => {
																				const canvas = canvasRef.current;
																				if (canvas) {
																					const ctx = canvas.getContext('2d');
																					if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
																					setIsCanvasDirty(false);
																				}
																			}}
																			className="flex items-center gap-1.5 text-[10px] font-medium text-red-500 hover:text-red-600 transition"
																		>
																			<RotateCcw size={12} />
																			Hapus
																		</button>
																	</div>
																</div>
															)}

															{signatureMode === 'upload' && (
																<div className="flex-1 flex flex-col">
																	<div
																		onClick={() => fileInputRef.current?.click()}
																		className="flex-1 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-all group"
																	>
																		{uploadPreview ? (
																			<img src={uploadPreview} alt="Preview" className="max-h-24 object-contain" />
																		) : (
																			<>
																				<Upload className="w-5 h-5 text-blue-600 mb-2" />
																				<p className="text-[10px] font-medium text-gray-500">Pilih File Tanda Tangan</p>
																			</>
																		)}
																		<input
																			type="file"
																			ref={fileInputRef}
																			className="hidden"
																			accept="image/*"
																			onChange={(e) => {
																				const file = e.target.files?.[0];
																				if (file) {
																					setUploadedFile(file);
																					const reader = new FileReader();
																					reader.onloadend = () => setUploadPreview(reader.result as string);
																					reader.readAsDataURL(file);
																				}
																			}}
																		/>
																	</div>
																	<div className="mt-2 flex items-center gap-2">
																		<input
																			type="checkbox"
																			id="save-upload"
																			checked={saveToProfile}
																			onChange={(e) => setSaveToProfile(e.target.checked)}
																			className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
																		/>
																		<label htmlFor="save-upload" className="text-[10px] font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
																			Simpan ke Profil
																		</label>
																	</div>
																</div>
															)}

															{signatureMode === 'saved' && (
																<div className="flex-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
																	{savedSignatures.length > 0 ? (
																		<div className="grid grid-cols-1 gap-3">
																			{savedSignatures.map((sig) => (
																				<div
																					key={sig.id}
																					onClick={() => setSelectedSavedId(sig.id)}
																					className={`relative p-3 border-2 rounded-xl cursor-pointer transition-all flex flex-col gap-2 ${selectedSavedId === sig.id
																						? 'border-blue-600 bg-white dark:bg-gray-800 ring-2 ring-blue-500/10'
																						: 'border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 hover:border-blue-300'}`}
																				>
																					<div className="aspect-[3/1] bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center p-2 shadow-inner">
																						<img src={sanitizeFileUrl(sig.imageUrl)} alt="Signature" className="max-h-full object-contain" />
																					</div>

																					<div className="flex items-center justify-between px-1">
																						<span className="text-[10px] text-gray-400">
																							{sig.isDefault ? 'Default Signature' : 'Tersimpan'}
																						</span>
																						<button
																							onClick={(e) => handleDeleteSignature(sig.id, e)}
																							className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
																							title="Hapus"
																						>
																							<Trash2 size={14} />
																						</button>
																					</div>

																					{selectedSavedId === sig.id && (
																						<div className="absolute top-2 left-2 bg-blue-600 rounded-full p-0.5 shadow-sm">
																							<Check size={10} className="text-white" />
																						</div>
																					)}
																				</div>
																			))}
																		</div>
																	) : (
																		<div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
																			<Archive size={32} className="mb-2 opacity-20" />
																			<p className="text-[10px] italic">Belum ada tanda tangan tersimpan</p>
																		</div>
																	)}
																</div>
															)}
														</div>
													</div>
												)}

												{activeAction === 'revision' && (
													<div className="space-y-3">
														<div>
															<label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">Tujuan Revisi</label>
															<select
																value={revisionTarget}
																onChange={(e) => setRevisionTarget(Number(e.target.value))}
																className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
															>
																<option value={1}>Supervisor Akademik (SA)</option>
																<option value={0}>Mahasiswa</option>
															</select>
														</div>
													</div>
												)}

												{activeAction === 'forward' && (
													<div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
														<p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
															Pastikan tanda tangan sudah sesuai pada pratinjau surat di sebelah kiri sebelum mengirim ke UPA.
														</p>
													</div>
												)}

												{/* Shared Comment Field (Except for Forward maybe, but keep it available) */}
												<div className="space-y-1.5">
													<label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
														{activeAction === 'forward' ? 'Catatan (Opsional)' : 'Catatan / Alasan'}
													</label>
													<textarea
														className="w-full px-3 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm min-h-[80px] focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
														placeholder={activeAction === 'reject' ? "Berikan alasan penolakan..." : "Tambah catatan..."}
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
														disabled={
															actionLoading ||
															(activeAction === 'sign' && (
																(signatureMode === 'draw' && !isCanvasDirty) ||
																(signatureMode === 'upload' && !uploadedFile) ||
																(signatureMode === 'saved' && !selectedSavedId)
															))
														}
														className={`flex-[2] px-4 py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-95 ${(activeAction === 'sign' && (
															(signatureMode === 'draw' && !isCanvasDirty) ||
															(signatureMode === 'upload' && !uploadedFile) ||
															(signatureMode === 'saved' && !selectedSavedId)
														)) ? 'bg-gray-400 cursor-not-allowed shadow-none' :
															(activeAction === 'reject' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
																activeAction === 'revision' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' :
																	activeAction === 'forward' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' :
																		'bg-blue-600 hover:bg-blue-700 shadow-blue-200')
															}`}
													>
														{actionLoading && <Loader2 size={14} className="animate-spin" />}
														{activeAction === 'sign' ? 'Simpan' :
															activeAction === 'forward' ? 'Konfirmasi Kirim' :
																'Kirim Balasan'}
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
									<Clock className="w-5 h-5 text-blue-500" />
									<h3 className="text-lg font-bold text-gray-900 dark:text-white">Riwayat Proses</h3>
								</div>
								{letterId && <LetterTimeline letterId={letterId} role="mtu" refreshKey={timelineRefreshKey} />}
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
