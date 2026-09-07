"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/layouts/TopBar";

import { letterApi, type LetterInstance } from "@/lib/api";
import { Loader2, X } from "lucide-react";
import { LetterTimeline } from "@/components/letter/LetterTimeline";
import { AttachmentList } from "@/components/letter/AttachmentList";
import { ApplicantInfoCard } from "@/components/letter/details/ApplicantInfoCard";
import { LetterDetailsCard } from "@/components/letter/details/LetterDetailsCard";
import { ParentInfoCard } from "@/components/letter/details/ParentInfoCard";
import { AK006LetterTemplate } from "@/components/templates/AK006LetterTemplate";
import { useAK006Template } from "@/hooks/use-ak006-template";
import { LetterPreviewCard } from "@/components/letter/LetterPreviewCard";

function DetailSuratPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const letterId = searchParams.get('id');

	const [activeMenu, setActiveMenu] = useState("surat-saya");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isIdentitasOpen, setIsIdentitasOpen] = useState(true);
	const [isDetailSuratOpen, setIsDetailSuratOpen] = useState(true);
	const [isOrangTuaOpen, setIsOrangTuaOpen] = useState(true);
	const [isLampiranOpen, setIsLampiranOpen] = useState(true);
	const [isPreviewOpen, setIsPreviewOpen] = useState(true);

	// API data states
	const [letter, setLetter] = useState<LetterInstance | null>(null);
	// Use stored template snapshot from letter if available, otherwise fetch latest
	const { templateConfig, loading: templateLoading } = useAK006Template(letter?.templateConfig);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

	// Cancellation modal state
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);

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
				const response = await letterApi.getLetterById(letterId);

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

	// Map letter data to display format
	// Prioritize letter.values (user-edited data) over letter.createdBy (default data)
	const suratData = letter ? {
		namaLengkap: letter.values?.nama_lengkap || letter.createdBy?.name || '-',
		nim: letter.values?.nim || letter.createdBy?.mahasiswa?.nim || '-',
		email: letter.values?.email || letter.createdBy?.email || '-',
		departemen: letter.values?.departemen || letter.createdBy?.mahasiswa?.departemen?.name || '-',
		programStudi: letter.values?.program_studi || letter.createdBy?.mahasiswa?.programStudi?.name || '-',
		tempatLahir: letter.values?.tempat_lahir || '-',
		tanggalLahir: letter.values?.tanggal_lahir || '-',
		noHP: letter.values?.no_hp || '-',
		alamat: letter.values?.alamat || '-',
		jenisSurat: letter.letterType?.name || 'Surat Keterangan Aktif Kuliah',
		keperluan: letter.values?.keperluan || '-',
		semester: letter.values?.semester || '-',
		tahunAkademik: letter.values?.tahunAkademik || letter.values?.tahun_akademik || '-',
		namaOrtuWali: letter.values?.nama_ortu_wali || '-',
		nipPensiunOrtuWali: letter.values?.nip_pensiun_ortu_wali || '-',
		golonganOrtuWali: letter.values?.golongan_ortu_wali || '-',
		instansiOrtuWali: letter.values?.instansi_ortu_wali || '-',
	} : {
		namaLengkap: '-',
		nim: '-',
		email: '-',
		departemen: '-',
		programStudi: '-',
		tempatLahir: '-',
		tanggalLahir: '-',
		noHP: '-',
		alamat: '-',
		jenisSurat: '-',
		keperluan: '-',
		semester: '-',
		tahunAkademik: '-',
		namaOrtuWali: '-',
		nipPensiunOrtuWali: '-',
		golonganOrtuWali: '-',
		instansiOrtuWali: '-',
	};

	// Map letter data to template format for printing
	const templateData = letter ? {
		nama_lengkap: letter.values?.nama_lengkap || letter.createdBy?.name || "-",
		role: "Mahasiswa",
		nim: letter.values?.nim || letter.createdBy?.mahasiswa?.nim || "-",
		email: letter.values?.email || letter.createdBy?.email || "-",
		departemen: letter.values?.departemen || letter.createdBy?.mahasiswa?.departemen?.name || "-",
		program_studi: letter.values?.program_studi || letter.createdBy?.mahasiswa?.programStudi?.name || "-",
		tempat_lahir: letter.values?.tempat_lahir || "-",
		tanggal_lahir: letter.values?.tanggal_lahir || "-",
		no_hp: letter.values?.no_hp || "-",
		alamat: letter.values?.alamat || "-",
		jenis_surat: letter.letterType?.name || "Surat Keterangan Masih Kuliah",
		keperluan_surat: letter.values?.keperluan || "-",
		nama_ortu_wali: letter.values?.nama_ortu_wali || "-",
		nip_pensiun_ortu_wali: letter.values?.nip_pensiun_ortu_wali || "-",
		golongan_ortu_wali: letter.values?.golongan_ortu_wali || "-",
		instansi_ortu_wali: letter.values?.instansi_ortu_wali || "-",
		semester: letter.values?.semester,
		tahun_akademik: letter.values?.tahunAkademik || letter.values?.tahun_akademik,
		attachments: { mandatory: [], optional: [] }
	} : {
		// Fallback dummy data when no letterId
		nama_lengkap: "Ahmad Syaifullah",
		role: "Mahasiswa",
		nim: "24060121130001",
		email: "ahmad@students.undip.ac.id",
		departemen: "Informatika",
		program_studi: "S1 - Informatika",
		tempat_lahir: "Semarang",
		tanggal_lahir: "2003-01-01",
		no_hp: "08123456789",
		alamat: "Jl. Gondang Raya No. 1",
		jenis_surat: "Surat Keterangan Masih Kuliah",
		keperluan_surat: "Pengajuan Beasiswa Bank Indonesia",
		nama_ortu_wali: "Ibu Sejahtera",
		nip_pensiun_ortu_wali: "3895039142315241",
		golongan_ortu_wali: "-",
		instansi_ortu_wali: "-",
		attachments: { mandatory: [], optional: [] }
	};

	// Check for upper-level revisions (e.g., MTU sent back to SA)
	// If current step is 1 (SA) and there is a revision from step > 1, it implies SA is handling revision.
	const isRevisionForSupervisor = letter?.currentStep === 1 && letter?.approvalSteps?.some(step =>
		step.stepNumber > 1 && step.status === 'REVISION'
	) || false;

	// Check if letter can be cancelled
	// - Must be pending at SA step (Step 1)
	// - Must NOT be a revision from upper level (Supervisor Revision)
	const canCancel = letter && letter.status === 'PENDING' && letter.currentStep === 1 && !isRevisionForSupervisor;

	// Check if letter can be self-revised 
	// - Must be pending at SA step (Step 1)
	// - Must NOT be a revision from upper level (Supervisor Revision)
	const canSelfRevise = letter && letter.status === 'PENDING' && letter.currentStep === 1 && !isRevisionForSupervisor;

	// Check if letter needs revision FOR STUDENT
	// - Ideally, if the letter is sent back to student, currentStep becomes 0.
	const needsRevision = letter?.currentStep === 0;

	// Get latest revision comment if applicable
	const revisionComment = letter?.approvalSteps?.find(step =>
		step.status === 'REVISION' && !step.comments?.includes('[Direvisi oleh mahasiswa]')
	)?.comments || '';

	// Cancel letter handler
	const handleCancelLetter = async () => {
		if (!letterId) return;

		setIsCancelling(true);
		try {
			const response = await letterApi.cancelLetter(letterId);
			if (response.success) {
				setShowCancelModal(false);
				// alert('Pengajuan surat berhasil dibatalkan');
				// Clear draft data to prevent resumption of cancelled letter
				localStorage.removeItem('user_profile');
				localStorage.removeItem('reached_step');
				router.push('/mahasiswa/surat-saya');
			} else {
				console.error(response.message || 'Gagal membatalkan surat');
			}
		} catch (err) {
			console.error('Error cancelling letter:', err);
			console.error('Gagal membatalkan surat');
		} finally {
			setIsCancelling(false);
		}
	};

	const handleDownload = () => {
		// Use browser print dialog - same as pratinjau page
		window.print();
	};

	// Loading state
	if (isLoading || templateLoading) {
		return (
			<div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
				<TopBar role="Mahasiswa" />
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
	if (error) {
		return (
			<div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
				<TopBar role="Mahasiswa" />
				<div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
					<div className="text-center">
						<p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
						<button
							onClick={() => router.push('/mahasiswa/surat-saya')}
							className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
						>
							Kembali ke Surat Saya
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="min-h-screen flex flex-col dark:bg-gray-900 transition-colors duration-300">
				<TopBar role="Mahasiswa" onMenuClick={() => setSidebarOpen(true)} />

				<div className="flex flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
					{/* Mobile sidebar overlay */}
					{sidebarOpen && (
						<div
							className="fixed inset-0 top-14 sm:top-16 bg-black/50 z-[55] lg:hidden transition-opacity"
							onClick={() => setSidebarOpen(false)}
							aria-hidden="true"
						/>
					)}
					{/* Sidebar spacer */}
					<div className="w-0 lg:w-[280px] flex-shrink-0 overflow-hidden transition-all duration-300" />
					{/* Sidebar */}
					<aside className={`
						fixed left-0 top-14 sm:top-16
						w-[280px] h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)]
						bg-white dark:bg-gray-800 
						flex flex-col 
						text-gray-700 dark:text-gray-200 
						border-r border-gray-200 dark:border-gray-700 
						overflow-y-auto 
						z-[60] lg:z-40
						transform transition-transform duration-300 ease-in-out
						${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
					`}>
						<div className="p-4 space-y-2">
							{/* Mobile close button */}
							<div className="lg:hidden flex items-center justify-between mb-4 pb-2 border-b dark:border-gray-700">
								<span className="font-semibold dark:text-white">Menu</span>
								<button
									onClick={() => setSidebarOpen(false)}
									className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
							{/* Dasbor */}
							<div
								className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === "dasbor" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "hover:bg-gray-50 dark:hover:bg-gray-700"
									}`}
								onClick={() => {
									setSidebarOpen(false);
									setActiveMenu("dasbor");
									router.push("/mahasiswa/dashboard-mahasiswa");
								}}
							>
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
								</svg>
								<span className="font-medium">Dasbor</span>
							</div>

							{/* Surat Saya */}
							<div
								className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === "surat-saya" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "hover:bg-gray-50 dark:hover:bg-gray-700"
									}`}
								onClick={() => {
									setSidebarOpen(false);
									setActiveMenu("surat-saya");
									router.push("/mahasiswa/surat-saya");
								}}
							>
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
								</svg>
								<span className="font-medium">Surat Saya</span>
							</div>


							{/* Profil */}
							<div
								className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === "profil" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "hover:bg-gray-50 dark:hover:bg-gray-700"
									}`}
								onClick={() => {
									setSidebarOpen(false);
									setActiveMenu("profil");
									router.push("/mahasiswa/profile");
								}}
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								<span className="font-medium">Profil</span>
							</div>

						</div>

						{/* Logout Button */}
						<div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
							<button
								onClick={() => {
									if (confirm('Apakah Anda yakin ingin keluar?')) {
										router.push('/auth');
									}
								}}
								className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								<span className="font-medium">Keluar</span>
							</button>
						</div>
					</aside>

					{/* Main Content */}
					<main className="flex-1 p-4 lg:p-8 lg:px-24 pb-24">
						{/* Breadcrumb */}
						<div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
							<span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push("/mahasiswa/surat-saya")}>
								Persuratan
							</span>
							<span className="mx-2">/</span>
							<span className="text-gray-800 dark:text-white font-medium">Detail Surat</span>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
							{/* Left Column - Main Content */}
							<div className="lg:col-span-2 space-y-6">
								{/* Pratinjau Surat */}
								<LetterPreviewCard
									letter={letter}
									templateData={templateData}
									templateConfig={templateConfig}
									letterNumber={letter?.letterNumber}
									letterDate={letter?.archivedAt || letter?.updatedAt || letter?.createdAt}
									signatureUrl={letter?.signatureUrl}
									isOpen={isPreviewOpen}
									onToggle={() => setIsPreviewOpen(!isPreviewOpen)}
								/>

								{/* Identitas Pengaju */}
								<ApplicantInfoCard
									data={suratData}
									isOpen={isIdentitasOpen}
									onToggle={() => setIsIdentitasOpen(!isIdentitasOpen)}
								/>

								{/* Detail Surat Pengajuan */}
								<LetterDetailsCard
									data={suratData}
									isOpen={isDetailSuratOpen}
									onToggle={() => setIsDetailSuratOpen(!isDetailSuratOpen)}
								/>

								{/* Data Orang Tua */}
								<ParentInfoCard
									data={{
										nama: suratData.namaOrtuWali,
										nipPensiun: suratData.nipPensiunOrtuWali,
										pangkatGolongan: suratData.golonganOrtuWali,
										instansi: suratData.instansiOrtuWali
									}}
									isOpen={isOrangTuaOpen}
									onToggle={() => setIsOrangTuaOpen(!isOrangTuaOpen)}
								/>

								{/* Lampiran */}
								<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
									<div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => setIsLampiranOpen(!isLampiranOpen)}>
										<h2 className="text-lg font-semibold dark:text-white">Lampiran</h2>
										<svg width="20" height="20" fill="none" stroke="#0EA5E9" strokeWidth="2" className={`transition-transform ${isLampiranOpen ? 'rotate-0' : 'rotate-180'}`}>
											<polyline points="6 9 12 15 18 9" />
										</svg>
									</div>
									{isLampiranOpen && (
										<AttachmentList attachments={letter?.attachments} />
									)}
								</div>
							</div>

							{/* Right Sidebar */}
							<div className="space-y-6 sticky top-24 self-start">
								{/* Revision Alert */}
								{needsRevision && (
									<div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 transition-colors duration-300">
										<div className="flex items-start gap-3">
											<svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
												<path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
											<div>
												<h4 className="font-semibold text-orange-800 dark:text-orange-400 text-sm">Perlu Revisi</h4>
												<p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
													{revisionComment || 'Silakan perbaiki surat Anda sesuai catatan dari verifikator.'}
												</p>
											</div>
										</div>
									</div>
								)}

								{/* Aksi */}
								<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
									<h3 className="font-semibold mb-4 dark:text-white">Aksi</h3>
									<div className="space-y-3">
										{/* Hide old preview button as it's now inline */}
										{/* <button
											onClick={() => router.push(`/mahasiswa/pratinjau?id=${letterId}`)}
											className="w-full bg-[#4ADE80] dark:bg-green-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-600 dark:hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
										>
											<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
												<path d="M2 8C2 8 4.5 3 8 3C11.5 3 14 8 14 8C14 8 11.5 13 8 13C4.5 13 2 8 2 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
												<circle cx="8" cy="8" r="2" stroke="white" strokeWidth="1.5" />
											</svg>
											Lihat Pratinjau
										</button> */}
										{needsRevision ? (
											<button
												onClick={() => router.push(`/surat-keterangan-aktif-kuliah/identitas-pemohon?letterId=${letterId}&mode=revision`)}
												className="w-full bg-[#FB923C] dark:bg-orange-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-orange-600 dark:hover:bg-orange-600 flex items-center justify-center gap-2 transition-colors"
											>
												<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
													<path d="M11.5 1.5L14.5 4.5M14.5 4.5L5.5 13.5L1.5 14.5L2.5 10.5L11.5 1.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
												Edit & Ajukan Ulang
											</button>
										) : canSelfRevise ? (
											<button
												onClick={() => router.push(`/surat-keterangan-aktif-kuliah/identitas-pemohon?letterId=${letterId}&mode=self-revise`)}
												className="w-full bg-[#3B82F6] dark:bg-blue-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
											>
												<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
													<path d="M11.5 1.5L14.5 4.5M14.5 4.5L5.5 13.5L1.5 14.5L2.5 10.5L11.5 1.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
												Ajukan Revisi
											</button>
										) : null}
										{letter?.status === 'COMPLETED' && (
											<button
												onClick={handleDownload}
												className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
											>
												<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
													<path d="M8 3V10M8 10L11 7M8 10L5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
													<path d="M13 13H3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
												</svg>
												Download Surat
											</button>
										)}
										{canCancel && (
											<button
												onClick={() => setShowCancelModal(true)}
												className="w-full bg-red-500 dark:bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-red-600 dark:hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
											>
												<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
													<path d="M2 4H14M5.5 4V3C5.5 2.44772 5.94772 2 6.5 2H9.5C10.0523 2 10.5 2.44772 10.5 3V4M12.5 4V13C12.5 13.5523 12.0523 14 11.5 14H4.5C3.94772 14 3.5 13.5523 3.5 13V4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
												Batalkan Pengajuan
											</button>
										)}
									</div>
								</div>

								{/* Riwayat Surat */}
								<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
									<h3 className="font-semibold mb-4 dark:text-white">Riwayat Surat</h3>
									{letterId && <LetterTimeline letterId={letterId} refreshKey={timelineRefreshKey} />}
								</div>
							</div>
						</div>
					</main>
				</div>

				{/* Cancel Confirmation Modal */}
				{showCancelModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
						<div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl p-8 transition-colors duration-300">
							<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Batalkan Pengajuan</h2>

							<div className="space-y-6 mb-8">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Agenda</span>
										<span className="text-base text-gray-900 dark:text-white block font-medium">{letter?.temporaryAgenda || letter?.letterNumber || '-'}</span>
									</div>
									<div>
										<span className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Jenis Surat</span>
										<span className="text-base text-gray-900 dark:text-white block font-medium">{suratData.jenisSurat}</span>
									</div>
								</div>

								<div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
									<p className="text-red-700 dark:text-red-300 leading-relaxed">
										Apakah Anda yakin ingin membatalkan pengajuan surat ini? <br />
										<span className="text-sm opacity-80">Tindakan ini tidak dapat dibatalkan dan Anda harus mengajukan ulang jika ingin membuat surat baru.</span>
									</p>
								</div>
							</div>

							<div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
								<button
									onClick={() => setShowCancelModal(false)}
									className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
								>
									Kembali
								</button>
								<button
									onClick={handleCancelLetter}
									disabled={isCancelling}
									className="px-6 py-2.5 bg-red-600 dark:bg-red-500 text-white rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center gap-2"
								>
									{isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
									{isCancelling ? 'Memproses...' : 'Batalkan Pengajuan'}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Print Area - Hidden on screen, visible when printing */}
			<div id="print-area" style={{ display: 'none' }}>
				<style>{`
					@media print {
						#print-area {
							display: block !important;
						}
					}
				`}</style>
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

		</>
	);
}

export default function DetailSuratPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
			<DetailSuratPageContent />
		</Suspense>
	);
}
