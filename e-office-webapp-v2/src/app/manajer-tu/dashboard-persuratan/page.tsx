"use client";

import Breadcrumbs from "@/components/ui/Breadcrumbs";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from '@/hooks/use-app-router';
import { Eye } from "lucide-react";

import { AppSidebar } from "../../../components/layouts/SideBar";
import TopBar from "@/components/layouts/TopBar";


import { CardDashboard } from "@/components/ui/carddashboard";
import { letterApi, getStatusLabel, getStatusColor, getStepLabel, formatDate, type LetterInstance } from "@/lib/api";

type TableRow = {
	id: string;
	letterId: string;
	sumber: string;
	pengirim: string;
	perihal: string;
	tglLabel: string;
	tglISO: string; // yyyy-mm-dd
	tujuan: string;
	status: string;
	statusColor: string;
	needsAction: boolean;
};

export default function DashboardPage() {
	const router = useRouter();
	const tableRef = useRef<HTMLDivElement>(null);
	const [query, setQuery] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [tujuanFilter, setTujuanFilter] = useState<string>("all");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(5);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showStats, setShowStats] = useState(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('mtu-dashboard-show-stats');
			return saved !== null ? saved === 'true' : true;
		}
		return true;
	});

	// Page size options
	const pageSizeOptions = [5, 10, 25, 50, 100];

	// API data states
	const [tableData, setTableData] = useState<TableRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [stats, setStats] = useState({ pending: 0, completed: 0, total: 0 });
	const [statusDist, setStatusDist] = useState([
		{ label: "Baru", value: 0, color: "#B0B0B0" },
		{ label: "Proses", value: 0, color: "#FFD600" },
		{ label: "Selesai", value: 0, color: "#4ADE80" },
		{ label: "Ditolak", value: 0, color: "#FF5A5A" },
	]);
	const [chartData, setChartData] = useState<{ week: string, count: number }[]>([]);

	// Calculate chart data from tableData (30 days trend)
	const calculateChartData = (data: TableRow[]) => {
		const now = new Date();
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Group by weeks (4 weeks)
		const weeks = [
			{ label: '1-7', start: 1, end: 7, count: 0 },
			{ label: '8-15', start: 8, end: 15, count: 0 },
			{ label: '16-23', start: 16, end: 23, count: 0 },
			{ label: '24-30', start: 24, end: 30, count: 0 },
		];

		data.forEach(row => {
			const date = new Date(row.tglISO);
			if (date >= thirtyDaysAgo && date <= now) {
				const daysAgo = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
				const dayInPeriod = 30 - daysAgo;

				weeks.forEach(week => {
					if (dayInPeriod >= week.start && dayInPeriod <= week.end) {
						week.count++;
					}
				});
			}
		});

		return weeks.map(w => ({ week: w.label, count: w.count }));
	};

	// Fetch data from API
	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Fetch both pending and processed letters
				const [pendingResponse, processedResponse] = await Promise.all([
					letterApi.getMTUPendingLetters(),
					letterApi.getMTUProcessedLetters()
				]);

				if (pendingResponse.success || processedResponse.success) {
					// Map pending letters
					const pendingData = pendingResponse.success && pendingResponse.data ? pendingResponse.data : [];
					const pendingMapped: TableRow[] = pendingData.map((item: LetterInstance) => ({
						id: item.letterNumber || 'Belum dinomori',
						letterId: item.id,
						sumber: "Internal",
						pengirim: item.createdBy?.name || 'Mahasiswa',
						perihal: item.letterType?.name || 'Surat Pernyataan Masih Kuliah',
						tglLabel: formatDate(item.createdAt),
						tglISO: item.createdAt.split('T')[0],
						tujuan: "Manajer TU",
						status: getStatusLabel(item.status),
						statusColor: getStatusColor(item.status),
						needsAction: true,
					}));

					// Map processed letters
					const processedData = processedResponse.success && processedResponse.data ? processedResponse.data : [];
					const processedMapped: TableRow[] = processedData.map((item: LetterInstance) => {
						let tujuanLabel = getStepLabel(item.currentStep);
						let statusLabel = getStatusLabel(item.status);
						let statusColor = getStatusColor(item.status);

						if (item.status === 'COMPLETED') {
							tujuanLabel = 'Selesai';
							statusLabel = 'Selesai';
							statusColor = '#4ADE80';
						} else if (item.status === 'REJECTED') {
							tujuanLabel = 'Ditolak';
							statusLabel = 'Ditolak';
							statusColor = '#FF5A5A';
						} else if (item.currentStep === 0) {
							// Ini adalah surat yang sedang direvisi oleh mahasiswa
							tujuanLabel = 'Mahasiswa';
							statusLabel = 'Perlu Revisi';
							statusColor = '#FB923C';
						} else if (item.status === 'REVISION') {
							// Status Revisi (Active) at other levels
							statusLabel = "Perlu Revisi";
							statusColor = "#FB923C";
							// Jika revisi, tujuan sesuai currentStep
							tujuanLabel = getStepLabel(item.currentStep);
						} else {
							// Normal flow
							if (statusLabel === 'Menunggu Verifikasi') {
								statusLabel = 'Dalam Proses';
							}
						}

						return {
							id: item.letterNumber || 'Belum dinomori',
							letterId: item.id,
							sumber: "Internal",
							pengirim: item.createdBy?.name || 'Mahasiswa',
							perihal: item.letterType?.name || 'Surat Pernyataan Masih Kuliah',
							tglLabel: formatDate(item.createdAt),
							tglISO: item.createdAt.split('T')[0],
							tujuan: tujuanLabel,
							status: statusLabel,
							statusColor: statusColor,
							needsAction: tujuanLabel === 'Manajer TU',
						};
					});

					// Combine all letters for table with deduplication
					const uniqueLetters = new Map<string, TableRow>();

					// Add pending first
					pendingMapped.forEach(item => uniqueLetters.set(item.letterId, item));

					// Add processed if not exists
					processedMapped.forEach(item => {
						if (!uniqueLetters.has(item.letterId)) uniqueLetters.set(item.letterId, item);
					});

					const allLetters = Array.from(uniqueLetters.values());
					// Sort descending
					allLetters.sort((a, b) => new Date(b.tglISO).getTime() - new Date(a.tglISO).getTime());

					setTableData(allLetters);
					setChartData(calculateChartData(allLetters));

					// Calculate stats
					const pending = pendingMapped.length;
					const completed = processedData.filter((item: LetterInstance) => item.status === 'COMPLETED').length;
					const inProgress = processedData.filter((item: LetterInstance) => item.status !== 'COMPLETED' && item.status !== 'REJECTED').length;
					const rejected = processedData.filter((item: LetterInstance) => item.status === 'REJECTED').length;

					setStats({ pending, completed, total: allLetters.length });

					// Calculate status distribution
					const newDist = [
						{ label: "Baru", value: pending, color: "#B0B0B0" },
						{ label: "Proses", value: inProgress, color: "#FFD600" },
						{ label: "Selesai", value: completed, color: "#4ADE80" },
						{ label: "Ditolak", value: rejected, color: "#FF5A5A" },
					];
					setStatusDist(newDist);
				} else {
					setError((pendingResponse.message || processedResponse.message) || 'Gagal memuat data');
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

	const cards = [
		{
			title: "Perlu Tindakan",
			value: stats.pending,
			desc: "surat belum diproses",
			icon: (
				<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M8 12h8" /></svg>
			),
		},
		{
			title: "Selesai (Bulan Ini)",
			value: stats.completed,
			desc: "surat telah diarsipkan",
			icon: (
				<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
			),
		},
		{
			title: "Total Surat (Bulan Ini)",
			value: stats.total,
			desc: "total volume bulan ini",
			icon: (
				<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>
			),
		},
	];

	const handleCardClick = (filterType: string) => {
		setQuery("");

		if (filterType === "pending") {
			// Perlu Tindakan: show letters that are pending at MTU (tujuan = "Manajer TU")
			setStatusFilter("all");
			setTujuanFilter("Manajer TU");
			setDateFrom("");
			setDateTo("");
		} else {
			// Selesai & Total: filter by current month
			setTujuanFilter("all");
			const now = new Date();
			const year = now.getFullYear();
			const month = now.getMonth(); // 0-indexed (0 = January)
			const firstDay = new Date(year, month, 1);
			const lastDay = new Date(year, month + 1, 0);

			const startDate = firstDay.toISOString().split('T')[0]; // YYYY-MM-DD
			const endDate = lastDay.toISOString().split('T')[0];

			if (filterType === "completed") {
				setStatusFilter("Selesai");
			} else if (filterType === "all") {
				setStatusFilter("all");
			}
			setDateFrom(startDate);
			setDateTo(endDate);
		}

		// Scroll to table
		setTimeout(() => {
			if (tableRef.current) {
				tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		}, 100);
	};

	const statusOptions = useMemo(() => {
		const unique = Array.from(new Set(tableData.map((r) => r.status)));
		return unique.sort((a, b) => a.localeCompare(b));
	}, [tableData]);

	const filteredRows = useMemo(() => {
		const q = query.trim().toLowerCase();
		const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
		const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

		return tableData.filter((row) => {
			if (statusFilter !== "all" && row.status !== statusFilter) return false;
			if (tujuanFilter !== "all" && row.tujuan !== tujuanFilter) return false;

			const rowDate = new Date(`${row.tglISO}T12:00:00`);
			if (from && rowDate < from) return false;
			if (to && rowDate > to) return false;

			if (!q) return true;
			const haystack = [
				row.id,
				row.sumber,
				row.pengirim,
				row.perihal,
				row.tujuan,
				row.status,
				row.tglLabel,
			]
				.join(" ")
				.toLowerCase();

			return haystack.includes(q);
		});
	}, [query, dateFrom, dateTo, statusFilter, tujuanFilter, tableData]);

	const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
	const safePage = Math.min(page, totalPages);
	const pagedRows = useMemo(() => {
		const start = (safePage - 1) * pageSize;
		return filteredRows.slice(start, start + pageSize);
	}, [filteredRows, safePage, pageSize]);

	React.useEffect(() => {
		setPage(1);
	}, [query, dateFrom, dateTo, statusFilter, tujuanFilter]);

	return (
		<div className="min-h-screen flex flex-col">
			<TopBar role="Manajer TU" onMenuClick={() => setSidebarOpen(true)} />
			<div className="flex flex-1 min-w-0 bg-[#F3F3F3] dark:bg-gray-900 transition-colors">
				<AppSidebar role="manajer-tu" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
				<main className="flex-1 min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-24 pt-6 sm:pt-8 pb-8">
					<div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
						<span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push("/")}>
							Home
						</span>
						<span className="mx-2">/</span>
						<span className="text-gray-800 dark:text-white font-medium">Dasbor</span>
					</div>
					<div className="flex items-center justify-between mb-6 sm:mb-8">
						<div>
							<h1 className="text-xl sm:text-2xl font-bold mb-1 text-gray-900 dark:text-white">Dashboard Persuratan</h1>
							<p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Pusat kendali untuk mengelola semua surat Fakultas Sains dan Matematika.</p>
						</div>
						<button
							onClick={() => {
								const next = !showStats;
								setShowStats(next);
								localStorage.setItem('mtu-dashboard-show-stats', String(next));
							}}
							className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
							title={showStats ? 'Sembunyikan Statistik' : 'Tampilkan Statistik'}
						>
							<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
								{showStats ? (
									<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
								) : (
									<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
								)}
							</svg>
							<span className="hidden sm:inline">{showStats ? 'Tutup Dashboard' : 'Lihat Dashboard'}</span>
						</button>
					</div>

					{showStats && (<>
						{/* Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
							<CardDashboard
								key={cards[0].title}
								title={cards[0].title}
								value={cards[0].value}
								desc={cards[0].desc}
								icon={cards[0].icon}
								onClick={() => handleCardClick("pending")}
								isActive={tujuanFilter === "Manajer TU"}
								color="orange"
								highlight
							/>
							<CardDashboard
								key={cards[1].title}
								title={cards[1].title}
								value={cards[1].value}
								desc={cards[1].desc}
								icon={cards[1].icon}
								onClick={() => handleCardClick("completed")}
								isActive={statusFilter === "Selesai"}
								color="green"
							/>
							<CardDashboard
								key={cards[2].title}
								title={cards[2].title}
								value={cards[2].value}
								desc={cards[2].desc}
								icon={cards[2].icon}
								onClick={() => handleCardClick("all")}
								isActive={statusFilter === "all" && tujuanFilter === "all"}
								color="blue"
							/>
						</div>

						{/* Chart & Status Distribution */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
							{/* Chart */}
							<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:col-span-2 flex flex-col transition-colors">
								<div className="flex items-center justify-between mb-4">
									<span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Tren Volume 30 Hari</span>
									<span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-2 sm:px-2.5 py-1 rounded-full">4 Minggu Terakhir</span>
								</div>
								<div className="h-32 sm:h-40 flex items-end">
									{(() => {
										const maxCount = Math.max(...chartData.map(d => d.count), 1);
										const yScale = maxCount > 0 ? 90 / maxCount : 1;
										const xPositions = [110, 250, 390, 530];
										const yMax = Math.ceil(maxCount / 25) * 25 || 75;

										const points = chartData.map((d, i) => ({
											x: xPositions[i],
											y: 118 - (d.count * yScale),
											count: d.count
										}));

										const pathD = points.length >= 2
											? `M${points[0].x} ${points[0].y} ` +
											points.slice(1).map((p, i) => {
												const prev = points[i];
												const cpX = (prev.x + p.x) / 2;
												return `Q${cpX} ${prev.y} ${p.x} ${p.y}`;
											}).join(' ')
											: '';

										const areaD = pathD
											? `${pathD} L${points[points.length - 1].x} 118 L${points[0].x} 118 Z`
											: '';

										return (
											<svg width="100%" height="100%" viewBox="0 0 560 140" preserveAspectRatio="xMidYMid meet">
												<defs>
													<linearGradient id="chartGradientMTU" x1="0" y1="0" x2="0" y2="1">
														<stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
														<stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
													</linearGradient>
												</defs>

												<line x1="56" y1="28" x2="548" y2="28" stroke="#E5EAF1" className="dark:stroke-gray-700" strokeWidth="1" strokeDasharray="4 4" />
												<line x1="56" y1="58" x2="548" y2="58" stroke="#E5EAF1" className="dark:stroke-gray-700" strokeWidth="1" strokeDasharray="4 4" />
												<line x1="56" y1="88" x2="548" y2="88" stroke="#E5EAF1" className="dark:stroke-gray-700" strokeWidth="1" strokeDasharray="4 4" />
												<line x1="56" y1="118" x2="548" y2="118" stroke="#E5EAF1" className="dark:stroke-gray-700" strokeWidth="1" strokeDasharray="4 4" />

												<text x="18" y="32" fontSize="11" fill="#A3AED0" fontWeight="500">{yMax}</text>
												<text x="18" y="62" fontSize="11" fill="#A3AED0" fontWeight="500">{Math.round(yMax * 2 / 3)}</text>
												<text x="18" y="92" fontSize="11" fill="#A3AED0" fontWeight="500">{Math.round(yMax / 3)}</text>
												<text x="22" y="122" fontSize="11" fill="#A3AED0" fontWeight="500">0</text>

												{areaD && <path d={areaD} fill="url(#chartGradientMTU)" />}

												{pathD && <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

												{points.map((p, i) => (
													<circle key={i} cx={p.x} cy={p.y} r="5" fill="#2563EB" stroke="#ffffff" strokeWidth="2.5" />
												))}

												{chartData.map((d, i) => (
													<text key={i} x={xPositions[i]} y="136" fontSize="11" textAnchor="middle" fill="#A3AED0" fontWeight="600">{d.week}</text>
												))}
											</svg>
										);
									})()}
								</div>
							</div>
							{/* Status Distribution */}
							<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 flex flex-col transition-colors min-h-[100px]">
								<span className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Distribusi Status</span>
								<div className="grid grid-cols-4 gap-2 sm:gap-4 flex-1">
									{statusDist.map((s) => (
										<div key={s.label} className="flex flex-col items-center justify-end h-full">
											<span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 mb-1 sm:mb-2">{s.value}</span>
											<div className="flex-1 flex items-end w-full">
												<div
													className="w-full rounded-lg transition-all duration-500"
													style={{
														height: `${Math.max(s.value * 12, 8)}%`,
														background: `linear-gradient(to top, ${s.color}, ${s.color}88)`,
														minHeight: 10,
														maxHeight: '100%',
													}}
												/>
											</div>
											<span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-2 text-center leading-tight">{s.label}</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</>)}

					{/* Table */}
					<div ref={tableRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 transition-colors">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 gap-3">
							<span className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">Semua Surat</span>
							<div className="flex flex-col sm:flex-row gap-2">
								<input
									className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 sm:py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-colors"
									placeholder="Cari surat..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
								<div className="hidden sm:flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-gray-50 dark:bg-gray-700 transition-colors">
									<span className="text-gray-500 dark:text-gray-400">Rentang</span>
									<input
										type="date"
										className="bg-transparent outline-none text-gray-900 dark:text-gray-100"
										value={dateFrom}
										onChange={(e) => setDateFrom(e.target.value)}
									/>
									<span className="text-gray-400 dark:text-gray-500">-</span>
									<input
										type="date"
										className="bg-transparent outline-none text-gray-900 dark:text-gray-100"
										value={dateTo}
										onChange={(e) => setDateTo(e.target.value)}
									/>
								</div>
								<select
									className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 sm:py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-colors"
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
								>
									<option value="all">Semua Status</option>
									{statusOptions.map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Mobile Card View */}
						<div className="md:hidden space-y-3">
							{isLoading ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">
									<div className="flex items-center justify-center gap-2">
										<svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
										<span>Memuat data...</span>
									</div>
								</div>
							) : error ? (
								<div className="py-8 text-center text-red-500 dark:text-red-400">{error}</div>
							) : pagedRows.length === 0 ? (
								<div className="py-8 text-center text-gray-500 dark:text-gray-400">Tidak ada surat yang ditemukan</div>
							) : (
								pagedRows.map((row) => (
									<div key={row.letterId} className={`border rounded-xl p-4 space-y-2 ${row.needsAction ? 'border-amber-300 dark:border-amber-600 bg-amber-50/80 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-700' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}>
										<div className="flex justify-between items-start">
											<span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.id}</span>
											<span
												className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
												style={{
													backgroundColor: `${row.statusColor}18`,
													color: row.statusColor,
												}}
											>
												<span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.statusColor }} />
												{row.status}
											</span>
										</div>
										<p className="text-sm font-medium text-gray-900 dark:text-white">{row.perihal}</p>
										<div className="grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
											<span>Pengirim: <span className="text-gray-900 dark:text-gray-200">{row.pengirim}</span></span>
											<span>Tanggal: <span className="text-gray-900 dark:text-gray-200">{row.tglLabel}</span></span>
											<span>Tujuan: <span className="text-gray-900 dark:text-gray-200">{row.tujuan}</span></span>
											<span>Sumber: <span className="text-gray-900 dark:text-gray-200">{row.sumber}</span></span>
										</div>
										<button
											onClick={() => router.push(`/manajer-tu/penerima/identitas-pemohon?id=${row.letterId}`)}
											className="w-full mt-2 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
										>
											<Eye className="w-4 h-4" />
											Lihat Detail
										</button>
									</div>
								))
							)}
						</div>

						{/* Desktop Table View */}
						<div className="hidden md:block overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
										<th className="py-2 px-2">ID/AGENDA</th>
										<th className="py-2 px-2">SUMBER</th>
										<th className="py-2 px-2">PENGIRIM/PEMOHON</th>
										<th className="py-2 px-2">PERIHAL</th>
										<th className="py-2 px-2">TANGGAL DITERIMA</th>
										<th className="py-2 px-2">TUJUAN SAAT INI</th>
										<th className="py-2 px-2">STATUS</th>
										<th className="py-2 px-2">AKSI</th>
									</tr>
								</thead>
								<tbody>
									{isLoading ? (
										<tr>
											<td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
												<div className="flex items-center justify-center gap-2">
													<svg className="w-5 h-5 animate-spin text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													<span>Memuat data...</span>
												</div>
											</td>
										</tr>
									) : error ? (
										<tr>
											<td colSpan={8} className="py-8 text-center text-red-500 dark:text-red-400">
												{error}
											</td>
										</tr>
									) : pagedRows.length === 0 ? (
										<tr>
											<td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
												Tidak ada surat yang ditemukan
											</td>
										</tr>
									) : (
										pagedRows.map((row) => (
											<tr key={row.letterId} className={`border-b transition-colors ${row.needsAction ? 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/15 hover:bg-amber-100/80 dark:hover:bg-amber-900/25' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
												<td className="py-2 px-2 font-mono text-gray-900 dark:text-gray-100">{row.id}</td>
												<td className="py-2 px-2"><span className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-gray-100">{row.sumber}</span></td>
												<td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.pengirim}</td>
												<td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.perihal}</td>
												<td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.tglLabel}</td>
												<td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.tujuan}</td>
												<td className="py-2 px-2">
													<span
														className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
														style={{
															backgroundColor: `${row.statusColor}18`,
															color: row.statusColor,
														}}
													>
														<span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.statusColor }} />
														{row.status}
													</span>
												</td>
												<td className="py-2 px-2">
													<button
														onClick={() => router.push(`/manajer-tu/penerima/identitas-pemohon?id=${row.letterId}`)}
														className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
														title="Lihat Detail"
													>
														<Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
													</button>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>

						<div className="flex flex-col sm:flex-row justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400 gap-4">
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
										className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer transition-colors"
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
									className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
											className={`border border-gray-300 dark:border-gray-600 rounded px-2 py-1 transition-colors ${isActive ? "bg-blue-600 dark:bg-blue-500 text-white" : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
											onClick={() => setPage(pageNum)}
										>
											{pageNum}
										</button>
									);
								})}
								<button
									className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									disabled={safePage >= totalPages}
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								>
									&gt;
								</button>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}