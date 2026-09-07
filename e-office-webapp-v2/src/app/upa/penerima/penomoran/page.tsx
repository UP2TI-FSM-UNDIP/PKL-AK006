"use client";
import { Suspense } from 'react';

import { useState, useEffect, useRef } from "react";
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from "next/navigation";
import { AppSidebar } from "../../../../components/layouts/SideBar";
import TopBar from "@/components/layouts/TopBar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { AK006LetterTemplate } from "@/components/templates/AK006LetterTemplate";
import { letterApi, formatDate, type LetterInstance } from "@/lib/api";
import { useAK006Template } from "@/hooks/use-ak006-template";

function PenomoranPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const letterId = searchParams.get('id');

	const [nomorSurat, setNomorSurat] = useState("");
	const [tanggalSurat, setTanggalSurat] = useState(new Date().toISOString().split('T')[0]);
	const [zoom, setZoom] = useState(100);
	const [nomorSuratError, setNomorSuratError] = useState<string | null>(null);

	// API data states
	const [letter, setLetter] = useState<LetterInstance | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const previewRef = useRef<HTMLDivElement>(null);
	const [previewWidth, setPreviewWidth] = useState(0);
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
					if (response.data.letterNumber) {
						setNomorSurat(response.data.letterNumber);
					}
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
		if (zoom < 200) setZoom(zoom + 10);
	};

	const handleZoomOut = () => {
		if (zoom > 50) setZoom(zoom - 10);
	};

	const validateNomorSurat = (value: string): boolean => {
		if (!value || value.trim() === "") {
			setNomorSuratError("Nomor surat wajib diisi");
			return false;
		}
		setNomorSuratError(null);
		return true;
	};

	// Measure preview container width for responsive scaling
	useEffect(() => {
		const updateWidth = () => {
			if (previewRef.current) {
				setPreviewWidth(previewRef.current.clientWidth);
			}
		};
		updateWidth();
		window.addEventListener('resize', updateWidth);
		return () => window.removeEventListener('resize', updateWidth);
	}, []);

	const A4_WIDTH = 793;
	const A4_HEIGHT = 1122;
	const baseScale = previewWidth > 0 ? Math.min(1, (previewWidth - 16) / A4_WIDTH) : 0.5;
	const combinedScale = baseScale * (zoom / 100);
	const visualWidth = A4_WIDTH * combinedScale;
	const visualHeight = A4_HEIGHT * combinedScale;

	const handleNomorSuratChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setNomorSurat(value);
		if (nomorSuratError) {
			validateNomorSurat(value);
		}
	};

	const handleFinalize = async () => {
		if (!letterId) return;

		// Validasi nomor surat
		if (!validateNomorSurat(nomorSurat)) {
			return;
		}

		// Show confirmation modal instead of immediately finalizing
		setShowConfirmModal(true);
	};

	// Function to actually finalize after confirmation
	const confirmFinalize = async () => {
		if (!letterId) return;

		setShowConfirmModal(false);
		setIsSubmitting(true);
		try {
			// Finalisasi surat dengan nomor surat dan tanggal
			const response = await letterApi.finalizeLetter(letterId, {
				letterNumber: nomorSurat.trim(),
				letterDate: tanggalSurat
			});

			if (response.success) {
				// alert('Surat berhasil diterbitkan');
				// Redirect back to identitas-pemohon page to see updated status
				router.push(`/upa/penerima/identitas-pemohon?id=${letterId}`);
			} else {
				// Tampilkan pesan error yang lebih detail
				if (response.message?.includes('tidak ditemukan')) {
					console.error('Data surat tidak ditemukan. Pastikan surat masih tersedia dan belum diterbitkan.');
				} else {
					console.error(response.message || 'Gagal menerbitkan surat');
				}
			}
		} catch (err) {
			console.error('Error finalizing letter:', err);
			console.error('Terjadi kesalahan saat menerbitkan surat. Silakan coba lagi.');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading || templateLoading) {
		return (
			<div className="min-h-screen flex flex-col">
				<TopBar role="UPA" onMenuClick={() => setSidebarOpen(true)} />
				<div className="flex flex-1 bg-[#F3F3F3] dark:bg-gray-900 items-center justify-center transition-colors">
					<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
						<svg className="animate-spin h-5 w-5 text-blue-500 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
				<div className="flex flex-col flex-1 min-h-screen min-w-0">
					<main className="flex-1 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-8 min-w-0 overflow-x-hidden">
						<div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
							<span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push(`/upa/penerima/identitas-pemohon?id=${letterId}`)}>
								Detail Surat
							</span>
							<span className="mx-2">/</span>
							<span className="text-gray-800 dark:text-white font-medium">Penomoran</span>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-6">
							{/* Left Column - Form */}
							<div className="lg:col-span-2 space-y-4 sm:space-y-6">
								<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 transition-colors">
									<div className="flex items-center gap-2 mb-6">
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
											<path d="M4 4h12v12H4V4z" stroke="#0EA5E9" strokeWidth="1.5" fill="none" />
											<path d="M7 7h6M7 10h6M7 13h4" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" />
										</svg>
										<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">Form Penomoran</h2>
									</div>

									<p className="text-sm text-gray-600 dark:text-gray-400 mb-6 transition-colors">
										Lengkapi dan cek kembali data sebelum dikirim ke tujuan selanjutnya.
									</p>

									<div className="space-y-6">
										{/* Nomor Surat */}
										<div>
											<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 transition-colors">
												Nomor Surat <span className="text-blue-500 dark:text-blue-400" title="Masukkan nomor surat secara manual">ⓘ</span>
											</label>
											<input
												type="text"
												value={nomorSurat}
												onChange={handleNomorSuratChange}
												placeholder="Contoh: 611/UN7.F8.4/AK/V/2026"
												className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${nomorSuratError
													? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400'
													: 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400'
													}`}
											/>
											{nomorSuratError && (
												<p className="mt-1 text-xs text-red-500 dark:text-red-400">{nomorSuratError}</p>
											)}
										</div>

										{/* Tanggal Surat */}
										<div>
											<label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 transition-colors">
												Tanggal Surat
											</label>
											<input
												type="date"
												value={tanggalSurat}
												onChange={(e) => setTanggalSurat(e.target.value)}
												className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
											/>
										</div>

										{/* Info Box */}
										<div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg transition-colors">
											<p className="text-xs text-blue-800 dark:text-blue-300 transition-colors">
												<span className="font-semibold">Ringkasan:</span> {nomorSurat ? (
													<>Nomor surat <span className="font-semibold">{nomorSurat}</span> akan ditetapkan untuk surat ini.</>
												) : (
													<span className="text-blue-600 dark:text-blue-400">Silakan masukkan nomor surat terlebih dahulu.</span>
												)}
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Right Column - Preview */}
							<div className="lg:col-span-4 space-y-4">
								<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 transition-colors">
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
										<h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100 transition-colors">
											<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
												<path d="M4 4h12v12H4V4z" stroke="#0EA5E9" strokeWidth="1.5" fill="none" />
											</svg>
											Pratinjau Surat
										</h3>
										<div className="flex items-center gap-2">
											<button
												onClick={handleZoomOut}
												className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
												disabled={zoom <= 50}
											>
												−
											</button>
											<span className="text-sm font-medium min-w-[45px] text-center text-gray-900 dark:text-gray-100 transition-colors">{zoom}%</span>
											<button
												onClick={handleZoomIn}
												className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
												disabled={zoom >= 200}
											>
												+
											</button>
										</div>
									</div>

									{/* Preview Content */}
									<div ref={previewRef} className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-auto p-2 sm:p-4 lg:p-8 transition-colors min-h-[300px] sm:min-h-[500px]">
										<div style={{ width: `${visualWidth}px`, height: `${visualHeight}px`, margin: '0 auto', position: 'relative' }}>
											<div className="bg-white dark:bg-gray-100 shadow-xl" style={{ width: `${A4_WIDTH}px`, position: 'absolute', top: 0, left: 0, transform: `scale(${combinedScale})`, transformOrigin: 'top left' }}>
												<div className="w-full">
													<AK006LetterTemplate
														data={templateData}
														letterNumber={nomorSurat}
														letterDate={tanggalSurat}
														signatureUrl={letter?.signatureUrl}
														templateConfig={templateConfig}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</main>
					{/* Footer Buttons sticky di bawah jika konten pendek, ikut konten jika panjang */}
					<div className="w-full px-3 sm:px-6 lg:px-8 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto transition-colors">
						<div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
							<button
								onClick={() => router.back()}
								className="w-full sm:w-auto px-8 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
							>
								Kembali
							</button>
							<div className="flex">
								<button
									onClick={handleFinalize}
									disabled={isSubmitting}
									className="w-full sm:w-auto px-8 py-2.5 bg-[#0EA5E9] dark:bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors"
								>
									Terbitkan Surat
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Confirmation Modal */}
			{
				showConfirmModal && (
					<div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
						<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
							{/* Modal Header */}
							<div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
											<path d="M9 12l2 2 4-4" />
											<circle cx="12" cy="12" r="10" />
										</svg>
									</div>
									<h3 className="text-lg font-semibold text-white">Konfirmasi Penerbitan</h3>
								</div>
							</div>

							{/* Modal Body */}
							<div className="px-6 py-5">
								<p className="text-gray-600 dark:text-gray-300 mb-4">
									Apakah Anda yakin ingin menerbitkan surat ini? Tindakan ini tidak dapat dibatalkan.
								</p>

								<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 transition-colors">
									<div className="flex justify-between text-sm">
										<span className="text-gray-500 dark:text-gray-400">Nomor Surat:</span>
										<span className="font-medium text-gray-900 dark:text-white">{nomorSurat || '-'}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-500 dark:text-gray-400">Tanggal Surat:</span>
										<span className="font-medium text-gray-900 dark:text-white">
											{new Date(tanggalSurat).toLocaleDateString('id-ID', {
												day: 'numeric',
												month: 'long',
												year: 'numeric'
											})}
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-500 dark:text-gray-400">Pemohon:</span>
										<span className="font-medium text-gray-900 dark:text-white">{templateData.nama_lengkap}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-500 dark:text-gray-400">NIM:</span>
										<span className="font-medium text-gray-900 dark:text-white">{templateData.nim}</span>
									</div>
								</div>
							</div>

							{/* Modal Footer */}
							<div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600 flex flex-col-reverse sm:flex-row gap-3 justify-end transition-colors">
								<button
									onClick={() => setShowConfirmModal(false)}
									className="w-full sm:w-auto px-5 py-2.5 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
								>
									Batal
								</button>
								<button
									onClick={confirmFinalize}
									disabled={isSubmitting}
									className="w-full sm:w-auto px-5 py-2.5 bg-blue-500 dark:bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
										'Ya, Terbitkan'
									)}
								</button>
							</div>
						</div>
					</div>
				)}
		</div>
	);
}

export default function PenomoranPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <PenomoranPageContent />
    </Suspense>
  );
}
