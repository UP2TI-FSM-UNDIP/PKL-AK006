"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from '@/hooks/use-app-router';
import { AppSidebar } from "../../../components/layouts/SideBar";
import TopBar from "@/components/layouts/TopBar";
import { letterApi, formatDate, getStatusLabel, getStatusColor, type LetterInstance } from "@/lib/api";

// Mobile card component for table rows
function MobileCard({ row, onView }: { row: any; onView: () => void }) {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-4 space-y-3 transition-colors">
			<div className="flex justify-between items-start">
				<div>
					<p className="text-xs text-gray-500 dark:text-gray-400">ID/Agenda</p>
					<p className="font-mono text-sm font-medium dark:text-gray-200">{row.id}</p>
				</div>
				<span className="flex items-center gap-1.5 text-xs dark:text-gray-300">
					<span className="w-2 h-2 rounded-full" style={{ background: row.statusColor }} />
					{row.status}
				</span>
			</div>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<div>
					<p className="text-xs text-gray-500 dark:text-gray-400">Pengirim</p>
					<p className="font-medium dark:text-gray-200">{row.pengirim}</p>
				</div>
				<div>
					<p className="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
					<p className="dark:text-gray-300">{row.tglLabel}</p>
				</div>
			</div>
			<div>
				<p className="text-xs text-gray-500 dark:text-gray-400">Perihal</p>
				<p className="text-sm dark:text-gray-300">{row.perihal}</p>
			</div>
			<button
				onClick={onView}
				className="w-full py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
			>
				Lihat Detail
			</button>
		</div>
	);
}

type TableRow = {
	id: string;
	letterId: string;
	sumber: string;
	pengirim: string;
	perihal: string;
	tglLabel: string;
	tglISO: string;
	tujuan: string;
	status: string;
	statusColor: string;
	programStudi: string;
	departemen: string;
};

export default function PenerimaPage() {
	const router = useRouter();
	// Filter states
	const [namaPemohon, setNamaPemohon] = useState("");
	const [prodi, setProdi] = useState("");
	const [nomorSurat, setNomorSurat] = useState("");
	const [jenisSurat, setJenisSurat] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");

	// Pagination state
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(5);

	// Page size options
	const pageSizeOptions = [5, 10, 25, 50, 100];

	// API data states
	const [tableData, setTableData] = useState<TableRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch data from API
	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Only fetch pending letters (dalam proses) for UPA
				const pendingResponse = await letterApi.getUPAPendingLetters();

				const mapLetter = (item: LetterInstance): TableRow => ({
					id: item.letterNumber || item.id,
					letterId: item.id,
					sumber: "Internal",
					pengirim: item.createdBy?.name || 'Mahasiswa',
					perihal: item.letterType?.name || 'Surat Pernyataan Masih Kuliah',
					tglLabel: formatDate(item.createdAt),
					tglISO: item.createdAt.split('T')[0],
					tujuan: "UPA",
					status: getStatusLabel(item.status),
					statusColor: getStatusColor(item.status),
					programStudi: item.createdBy?.mahasiswa?.programStudi?.name || item.values?.program_studi || '',
					departemen: item.createdBy?.mahasiswa?.departemen?.name || item.values?.departemen || '',
				});

				const pendingData = (pendingResponse.success ? pendingResponse.data || [] : []).map(mapLetter);

				// Sort by date (newest first)
				const sortedData = pendingData.sort((a, b) =>
					new Date(b.tglISO).getTime() - new Date(a.tglISO).getTime()
				);

				setTableData(sortedData);

				if (!pendingResponse.success) {
					setError(pendingResponse.message || 'Gagal memuat data');
				}
			} catch (err) {
				console.error('Error fetching data:', err);
				setError('Gagal memuat data. Pastikan server API berjalan.');
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);


	// Reset page to 1 when filters change
	useEffect(() => {
		setPage(1);
	}, [namaPemohon, prodi, nomorSurat, jenisSurat, dateFrom, dateTo]);

	const handleReset = () => {
		setNamaPemohon("");
		setProdi("");
		setNomorSurat("");
		setJenisSurat("");
		setDateFrom("");
		setDateTo("");
		setPage(1);
	};

	const filteredRows = useMemo(() => {
		const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
		const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

		return tableData.filter((row) => {
			if (namaPemohon && !row.pengirim.toLowerCase().includes(namaPemohon.toLowerCase())) return false;
			if (nomorSurat && !row.id.toLowerCase().includes(nomorSurat.toLowerCase())) return false;
			if (prodi && !row.programStudi.toLowerCase().includes(prodi.toLowerCase()) && !row.departemen.toLowerCase().includes(prodi.toLowerCase())) return false;
			if (jenisSurat && !row.perihal.toLowerCase().includes(jenisSurat.toLowerCase())) return false;

			const rowDate = new Date(`${row.tglISO}T12:00:00`);
			if (from && rowDate < from) return false;
			if (to && rowDate > to) return false;

			return true;
		});
	}, [namaPemohon, prodi, nomorSurat, jenisSurat, dateFrom, dateTo, tableData]);

	const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, totalPages);
	const pagedRows = useMemo(() => {
		const start = (safePage - 1) * pageSize;
		return filteredRows.slice(start, start + pageSize);
	}, [filteredRows, safePage, pageSize]);

	// Mobile sidebar state
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="min-h-screen flex flex-col">
			<TopBar role="UPA" onMenuClick={() => setSidebarOpen(true)} />
			<div className="flex flex-1 bg-[#F3F3F3] dark:bg-gray-900">
				<AppSidebar role="upa" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

				<main className="flex-1 px-4 sm:px-6 md:px-8 lg:px-12 pt-4 lg:pt-8 pb-8 w-full min-w-0">
					<div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
						<span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push("/upa/dashboard")}>
							Dasbor
						</span>
						<span className="mx-2">/</span>
						<span className="text-gray-800 dark:text-white font-medium">Penerima</span>
					</div>
					<h1 className="text-xl sm:text-2xl font-bold mb-1 dark:text-white">Penerima</h1>
					<p className="mb-4 sm:mb-6 text-gray-500 dark:text-gray-400 text-sm sm:text-base">Daftar surat masuk</p>

					{/* Filter Panel */}
					<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-4 sm:p-6 mb-4 sm:mb-6 transition-colors">
						<h2 className="font-semibold mb-6 text-lg dark:text-white">Filter Pencarian</h2>
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Informasi Pemohon */}
							<div className="bg-white dark:bg-gray-700 rounded-xl shadow-md dark:shadow-gray-900/50 overflow-hidden transition-colors">
								<div className="bg-[#0EA5E9] dark:bg-blue-600 text-white px-4 py-3">
									<h3 className="font-medium text-sm">Informasi Pemohon</h3>
								</div>
								<div className="p-4 space-y-4">
									<div>
										<label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 font-medium">Nama Pemohon</label>
										<input
											type="text"
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-200 bg-white dark:bg-gray-600 transition-colors"
											placeholder="Masukkan nama pemohon"
											value={namaPemohon}
											onChange={(e) => setNamaPemohon(e.target.value)}
										/>
									</div>
									<div>
										<label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 font-medium">Prodi/Departemen</label>
										<select
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-200 appearance-none bg-white dark:bg-gray-600 transition-colors"
											style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23666\' d=\'M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem' }}
											value={prodi}
											onChange={(e) => setProdi(e.target.value)}
										>
											<option value="">Pilih departemen</option>
											<option value="Informatika">Informatika</option>
											<option value="Matematika">Matematika</option>
											<option value="Statistika">Statistika</option>
											<option value="Kimia">Kimia</option>
											<option value="Fisika">Fisika</option>
											<option value="Biologi">Biologi</option>
											<option value="Bioteknologi">Bioteknologi</option>
										</select>
									</div>
									<div>
										<label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 font-medium">Nomor Surat/Agenda</label>
										<input
											type="text"
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-200 bg-white dark:bg-gray-600 transition-colors"
											placeholder="Masukkan nomor surat/agenda"
											value={nomorSurat}
											onChange={(e) => setNomorSurat(e.target.value)}
										/>
									</div>
								</div>
							</div>

							{/* Informasi Surat */}
							<div className="bg-white dark:bg-gray-700 rounded-xl shadow-md dark:shadow-gray-900/50 overflow-hidden transition-colors">
								<div className="bg-[#0EA5E9] dark:bg-blue-600 text-white px-4 py-3">
									<h3 className="font-medium text-sm">Informasi Surat</h3>
								</div>
								<div className="p-4 space-y-4">
									<div>
										<label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 font-medium">Jenis Surat</label>
										<input
											type="text"
											className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-200 bg-white dark:bg-gray-600 transition-colors"
											placeholder="Contoh: Keterangan Masih Kuliah"
											value={jenisSurat}
											onChange={(e) => setJenisSurat(e.target.value)}
										/>
									</div>
								</div>
							</div>

							{/* Periode Waktu */}
							<div className="bg-white dark:bg-gray-700 rounded-xl shadow-md dark:shadow-gray-900/50 overflow-hidden transition-colors">
								<div className="bg-[#0EA5E9] dark:bg-blue-600 text-white px-4 py-3">
									<h3 className="font-medium text-sm">Periode Waktu</h3>
								</div>
								<div className="p-4 space-y-4">
									<div>
										<label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 font-medium">Tanggal Diterima</label>
										<div className="flex gap-2 items-center border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-600 transition-colors">
											<input
												type="date"
												className="flex-1 text-sm text-gray-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-200 outline-none bg-transparent"
												placeholder="Start date"
												value={dateFrom}
												onChange={(e) => setDateFrom(e.target.value)}
											/>
											<span className="text-gray-400 dark:text-gray-500">→</span>
											<input
												type="date"
												className="flex-1 text-sm text-gray-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-200 outline-none bg-transparent"
												placeholder="End date"
												value={dateTo}
												onChange={(e) => setDateTo(e.target.value)}
											/>
											<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400 dark:text-gray-500">
												<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
												<line x1="16" y1="2" x2="16" y2="6" />
												<line x1="8" y1="2" x2="8" y2="6" />
												<line x1="3" y1="10" x2="21" y2="10" />
											</svg>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3 mt-6">
							<button
								onClick={handleReset}
								className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm transition-colors"
							>
								Reset
							</button>
						</div>
					</div>

					{/* Mobile Card View */}
					<div className="md:hidden space-y-3">
						{isLoading ? (
							<div className="bg-white rounded-xl p-8 text-center">
								<div className="flex items-center justify-center gap-2 text-gray-500">
									<svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									<span>Memuat data...</span>
								</div>
							</div>
						) : error ? (
							<div className="bg-white rounded-xl p-8 text-center text-red-500">{error}</div>
						) : pagedRows.length === 0 ? (
							<div className="bg-white rounded-xl p-8 text-center text-gray-500">
								Tidak ada surat yang menunggu penomoran
							</div>
						) : (
							pagedRows.map((row) => (
								<MobileCard
									key={row.letterId}
									row={row}
									onView={() => router.push(`/upa/penerima/penomoran?id=${row.letterId}`)}
								/>
							))
						)}
					</div>

					{/* Desktop Table View */}
					<div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 p-4 sm:p-6 transition-colors">
						<div className="overflow-x-auto -mx-4 sm:mx-0">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 text-xs">
										<th className="py-3 px-2 whitespace-nowrap">ID/AGENDA</th>
										<th className="py-3 px-2 whitespace-nowrap">SUMBER</th>
										<th className="py-3 px-2 whitespace-nowrap">PENGIRIM</th>
										<th className="py-3 px-2 whitespace-nowrap">PERIHAL</th>
										<th className="py-3 px-2 whitespace-nowrap">TANGGAL</th>
										<th className="py-3 px-2 whitespace-nowrap">TUJUAN</th>
										<th className="py-3 px-2 whitespace-nowrap">STATUS</th>
										<th className="py-3 px-2 whitespace-nowrap">AKSI</th>
									</tr>
								</thead>
								<tbody>
									{isLoading ? (
										<tr>
											<td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
												<div className="flex items-center justify-center gap-2">
													<svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													<span>Memuat data...</span>
												</div>
											</td>
										</tr>
									) : error ? (
										<tr>
											<td colSpan={8} className="py-8 text-center text-red-500 dark:text-red-400">{error}</td>
										</tr>
									) : pagedRows.length === 0 ? (
										<tr>
											<td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
												Tidak ada surat yang menunggu penomoran
											</td>
										</tr>
									) : pagedRows.map((row) => (
										<tr key={row.letterId} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
											<td className="py-2 px-2 font-mono dark:text-gray-300">{row.id}</td>
											<td className="py-2 px-2">
												<span className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-xs dark:text-gray-200">{row.sumber}</span>
											</td>
											<td className="py-2 px-2 dark:text-gray-300">{row.pengirim}</td>
											<td className="py-2 px-2 dark:text-gray-300">{row.perihal}</td>
											<td className="py-2 px-2 dark:text-gray-300">{row.tglLabel}</td>
											<td className="py-2 px-2 dark:text-gray-300">{row.tujuan}</td>
											<td className="py-2 px-2">
												<span className="flex items-center gap-2 dark:text-gray-300">
													<span className="w-2 h-2 rounded-full" style={{ background: row.statusColor }} />
													{row.status}
												</span>
											</td>
											<td className="py-2 px-2">
												<button
													className="hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 p-1 rounded transition-colors"
													title="Lihat Detail"
													onClick={() => router.push(`/upa/penerima/identitas-pemohon?id=${row.letterId}`)}
												>
													<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
														<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
														<circle cx="12" cy="12" r="3" />
													</svg>
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							<div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-xs text-gray-500 dark:text-gray-400 gap-4">
								<div className="flex items-center gap-4">
									<span>
										Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length}
									</span>
									<div className="flex items-center gap-2">
										<label className="text-xs text-gray-500 dark:text-gray-400">Show:</label>
										<select
											value={pageSize}
											onChange={(e) => {
												setPageSize(Number(e.target.value));
												setPage(1);
											}}
											className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none cursor-pointer transition-colors"
										>
											{pageSizeOptions.map((size) => (
												<option key={size} value={size}>
													{size}
												</option>
											))}
										</select>
									</div>
								</div>
								<div className="flex gap-1 items-center">
									<button
										className="border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={safePage <= 1}
										onClick={() => setPage((p) => Math.max(1, p - 1))}
									>
										&lt;
									</button>
									{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
										const pageNum = i + 1;
										const isActive = pageNum === safePage;
										return (
											<button
												key={pageNum}
												className={`border rounded px-2 py-1 ${isActive ? "bg-blue-600 text-white" : ""}`}
												onClick={() => setPage(pageNum)}
											>
												{pageNum}
											</button>
										);
									})}
									<button
										className="border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={safePage >= totalPages}
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									>
										&gt;
									</button>
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
