"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/layouts/TopBar";

import { letterApi, type LetterInstance } from "@/lib/api";
import { Loader2, X } from "lucide-react";

import { AK006LetterTemplate } from "@/components/templates/AK006LetterTemplate";
import { useAK006Template } from "@/hooks/use-ak006-template";

function PratinjauSuratMahasiswaPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const letterId = searchParams.get('id');
	const shouldPrint = searchParams.get('print') === 'true';

	const [zoom, setZoom] = useState(100);
	const [activeMenu, setActiveMenu] = useState("surat-saya");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const printRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(0);

	// API data states
	const [letter, setLetter] = useState<LetterInstance | null>(null);
	// Use stored template snapshot from letter if available, otherwise fetch latest
	const { templateConfig, loading: templateLoading } = useAK006Template(letter?.templateConfig);
	const [isLoading, setIsLoading] = useState(!!letterId);
	const [error, setError] = useState<string | null>(null);

	// Fetch letter data if letterId is provided
	useEffect(() => {
		if (!letterId) return;

		const fetchLetter = async () => {
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

	// Auto-print when shouldPrint is true and data is loaded
	useEffect(() => {
		if (shouldPrint && letter && !isLoading && !templateLoading) {
			// Small delay to ensure template is rendered
			const timer = setTimeout(() => {
				window.print();
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [shouldPrint, letter, isLoading, templateLoading]);

	// Map letter data to template format
	// Prioritize letter.values (data submitted by student) over letter.createdBy (default data)
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
		semester: 7,
		tahun_akademik: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
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

	const handlePrint = () => {
		window.print();
	};

	// A4 dimensions in pixels (210mm ≈ 793px, 297mm ≈ 1122px)
	const A4_WIDTH = 793;
	const A4_HEIGHT = 1122;
	// Calculate base scale to fit container, with some padding for the container's own padding
	const baseScale = containerWidth > 0 ? Math.min(1, (containerWidth - 16) / A4_WIDTH) : 0.5;
	// Combined scale = base scale * user zoom
	const combinedScale = baseScale * (zoom / 100);
	// Visual dimensions after scaling
	const visualWidth = A4_WIDTH * combinedScale;
	const visualHeight = A4_HEIGHT * combinedScale;

	// Loading state
	if (isLoading || templateLoading) {
		return (
			<div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
				<TopBar role="Mahasiswa" />
				<div className="flex-1 flex items-center justify-center">
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
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
						<button
							onClick={() => router.push('/mahasiswa/surat-saya')}
							className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
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
			{/* Print Styles */}
			<style jsx global>{`
				@media print {
					body * {
						visibility: hidden;
					}
					#print-area,
					#print-area * {
						visibility: visible;
					}
					#print-area {
						position: absolute;
						left: 0;
						top: 0;
						width: 100%;
					}
					.no-print {
						display: none !important;
					}
					@page {
						size: A4;
						margin: 0;
					}
				}
			`}</style>

			<div className="min-h-screen flex flex-col no-print bg-white dark:bg-gray-900 transition-colors duration-300">
				<TopBar role="Mahasiswa" onMenuClick={() => setSidebarOpen(true)} />
				<div className="flex flex-1 min-w-0 bg-gray-50 dark:bg-gray-900">
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
						text-gray-700 dark:text-gray-300 
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
					</aside>

					<main className="flex-1 min-w-0 overflow-x-hidden px-3 sm:px-4 lg:px-12 pt-4 sm:pt-8 pb-8">
						{/* Breadcrumb */}
						<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 flex flex-wrap items-center">
							<span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors" onClick={() => router.push("/mahasiswa/surat-saya")}>
								Persuratan
							</span>
							<span className="mx-1 sm:mx-2">/</span>
							<span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors" onClick={() => router.back()}>
								Detail Surat
							</span>
							<span className="mx-1 sm:mx-2">/</span>
							<span className="text-gray-800 dark:text-white font-medium">Pratinjau Surat</span>
						</div>

						{/* Header with Zoom Controls */}
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
							<div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
								<svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
									<polyline points="14 2 14 8 20 8" />
								</svg>
								<h1 className="text-base sm:text-lg font-semibold dark:text-white">Pratinjau Surat</h1>
							</div>

							<div className="flex items-center justify-between sm:justify-end gap-3">
								{/* Zoom Controls */}
								<div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
									<button
										onClick={handleZoomOut}
										className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold text-lg transition-colors"
										title="Zoom Out"
									>
										−
									</button>
									<button
										onClick={handleZoomReset}
										className="text-gray-700 dark:text-gray-300 font-medium min-w-[50px] sm:min-w-[60px] text-center hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors text-sm sm:text-base"
									>
										{zoom}%
									</button>
									<button
										onClick={handleZoomIn}
										className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold text-lg transition-colors"
										title="Zoom In"
									>
										+
									</button>
								</div>

								<div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
									Halaman 1 dari 1
								</div>
							</div>
						</div>

						{/* Document Viewer */}
						<div
							ref={containerRef}
							className="bg-[#E5E5E5] dark:bg-gray-950 rounded-lg p-2 sm:p-4 lg:p-8 overflow-auto transition-colors duration-300"
						>
							{/* Sizing wrapper - exact visual dimensions, centered when fits */}
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
										data={templateData}
										signatureUrl={letter?.signatureUrl}
										letterNumber={letter?.letterNumber || ''}
										letterDate={letter?.archivedAt || letter?.updatedAt || letter?.createdAt}
										letterId={letter?.id}
										status={letter?.status}
										templateConfig={templateConfig} />
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
							<button
								onClick={() => router.back()}
								className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
							>
								Kembali
							</button>
							{letter?.status === 'COMPLETED' && (
								<button
									onClick={handlePrint}
									className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
								>
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
										<path d="M4 6V2H12V6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M4 12H2V8C2 7.44772 2.44772 7 3 7H13C13.5523 7 14 7.44772 14 8V12H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										<path d="M4 10H12V14H4V10Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									Cetak / Download PDF
								</button>
							)}
						</div>
					</main>
				</div >
			</div >

			{/* Print Area - Hidden on screen, visible when printing */}
			< div id="print-area" ref={printRef} style={{ display: 'none' }
			}>
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
					templateConfig={templateConfig} />
			</div >

		</>
	);
}

export default function PratinjauSuratMahasiswaPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
			<PratinjauSuratMahasiswaPageContent />
		</Suspense>
	);
}
