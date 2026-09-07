"use client";

import React, { useState, useEffect , Suspense } from "react";
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/layouts/TopBar";
import { letterApi, formatDate, type LetterInstance } from "@/lib/api";
import { Loader2, ArrowLeft, Save } from "lucide-react";

function RevisiSuratPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const letterId = searchParams.get('id');

	// Form states
	const [keperluan, setKeperluan] = useState("");
	const [semester, setSemester] = useState<number>(1);
	const [tahunAkademik, setTahunAkademik] = useState("");

	// API states
	const [letter, setLetter] = useState<LetterInstance | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Check if this is SA-requested revision or self-revision
	const isRequestedRevision = letter?.approvalSteps?.some(step => step.status === 'REVISION') || false;
	const revisionComment = letter?.approvalSteps?.find(step => step.status === 'REVISION')?.comments || '';

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
					const letterData = response.data;
					setLetter(letterData);

					// Pre-fill form with current values
					setKeperluan(letterData.values?.keperluan || '');
					setSemester(letterData.values?.semester || 1);
					setTahunAkademik(letterData.values?.tahunAkademik || '');
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

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!letterId) return;

		if (!keperluan.trim()) {
			setError('Keperluan wajib diisi');
			return;
		}

		if (!tahunAkademik.trim()) {
			setError('Tahun akademik wajib diisi');
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await letterApi.updateLetter(letterId, {
				keperluan,
				semester,
				tahunAkademik,
			});

			if (response.success) {
				// alert(isRequestedRevision ? 'Surat berhasil diajukan ulang' : 'Detail surat berhasil diperbarui');
				router.push('/mahasiswa/surat-saya');
			} else {
				console.error(response.message || 'Gagal memperbarui surat');
				setError(response.message || 'Gagal memperbarui surat');
			}
		} catch (err) {
			console.error('Error submitting revision:', err);
			setError('Gagal memperbarui surat');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Loading state
	if (isLoading) {
		return (
			<div className="min-h-screen flex flex-col">
				<TopBar role="Mahasiswa" />
				<div className="flex-1 flex items-center justify-center">
					<div className="flex items-center gap-2 text-gray-600">
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
			<div className="min-h-screen flex flex-col">
				<TopBar role="Mahasiswa" />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<p className="text-red-500 mb-4">{error}</p>
						<button
							onClick={() => router.push('/mahasiswa/surat-saya')}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							Kembali ke Surat Saya
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<TopBar role="Mahasiswa" />

			<main className="flex-1 p-8" style={{ paddingLeft: 90, paddingRight: 90 }}>
				{/* Back Button */}
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
				>
					<ArrowLeft className="w-5 h-5" />
					<span>Kembali</span>
				</button>

				{/* Header */}
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-800">
						{isRequestedRevision ? 'Revisi Surat' : 'Ubah Detail Surat'}
					</h1>
					<p className="text-gray-600">
						{isRequestedRevision
							? 'Perbaiki data surat Anda sesuai dengan catatan dari verifikator'
							: 'Ubah detail surat Anda sebelum diverifikasi oleh Supervisor Akademik'
						}
					</p>
				</div>

				{/* Revision Alert - Only show if SA requested revision */}
				{isRequestedRevision && revisionComment && (
					<div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
						<div className="flex items-start gap-3">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
								<path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							<div>
								<h4 className="font-semibold text-orange-800 text-sm">Catatan Revisi dari Verifikator</h4>
								<p className="text-orange-700 text-sm mt-1">{revisionComment}</p>
							</div>
						</div>
					</div>
				)}

				{/* Info Alert - Only show for self-revision */}
				{!isRequestedRevision && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
						<div className="flex items-start gap-3">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
								<path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							<div>
								<h4 className="font-semibold text-blue-800 text-sm">Perubahan Detail Surat</h4>
								<p className="text-blue-700 text-sm mt-1">Anda dapat mengubah detail surat selama surat masih dalam proses verifikasi.</p>
							</div>
						</div>
					</div>
				)}

				{/* Form */}
				<div className="bg-white rounded-lg shadow p-6">
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Keperluan */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Keperluan Surat <span className="text-red-500">*</span>
							</label>
							<textarea
								value={keperluan}
								onChange={(e) => setKeperluan(e.target.value)}
								placeholder="Masukkan keperluan surat..."
								rows={3}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
								required
							/>
						</div>

						{/* Semester */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Semester <span className="text-red-500">*</span>
							</label>
							<select
								value={semester}
								onChange={(e) => setSemester(Number(e.target.value))}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								required
							>
								{Array.from({ length: 14 }, (_, i) => i + 1).map((sem) => (
									<option key={sem} value={sem}>
										Semester {sem}
									</option>
								))}
							</select>
						</div>

						{/* Tahun Akademik */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Tahun Akademik <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={tahunAkademik}
								onChange={(e) => setTahunAkademik(e.target.value)}
								placeholder="Contoh: 2025/2026"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
								required
							/>
						</div>

						{/* Buttons */}
						<div className="flex gap-4 pt-4">
							<button
								type="button"
								onClick={() => router.back()}
								className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
							>
								Batal
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin" />
										<span>{isRequestedRevision ? 'Mengajukan...' : 'Menyimpan...'}</span>
									</>
								) : (
									<>
										<Save className="w-5 h-5" />
										<span>{isRequestedRevision ? 'Ajukan Ulang' : 'Simpan Perubahan'}</span>
									</>
								)}
							</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}

export default function RevisiSuratPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <RevisiSuratPageContent />
    </Suspense>
  );
}
