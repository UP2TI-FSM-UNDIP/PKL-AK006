"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from '@/hooks/use-app-router';
import { AppSidebar } from "../../../components/layouts/SideBar";
import TopBar from "@/components/layouts/TopBar";
import { letterApi, formatDate, getStatusLabel, getStatusColor, type LetterInstance } from "@/lib/api";

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
    const [sidebarOpen, setSidebarOpen] = useState(false);
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
                const response = await letterApi.getSAPendingLetters();

                if (response.success) {
                    const data = response.data || [];
                    const mappedData: TableRow[] = data.map((item: LetterInstance) => ({
                        id: item.letterNumber || item.id,
                        letterId: item.id,
                        sumber: "Internal",
                        pengirim: item.createdBy?.name || 'Mahasiswa',
                        perihal: item.letterType?.name || 'Surat Pernyataan Masih Kuliah',
                        tglLabel: formatDate(item.createdAt),
                        tglISO: item.createdAt.split('T')[0],
                        tujuan: "Supervisor Akademik",
                        status: getStatusLabel(item.status),
                        statusColor: getStatusColor(item.status),
                        programStudi: item.createdBy?.mahasiswa?.programStudi?.name || item.values?.program_studi || '',
                        departemen: item.createdBy?.mahasiswa?.departemen?.name || item.values?.departemen || '',
                    }));
                    setTableData(mappedData);
                } else {
                    setTableData([]);
                    setError(response.message || 'Gagal memuat data');
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

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
            <TopBar role="Supervisor Akademik" onMenuClick={() => setSidebarOpen(true)} />
            <div className="flex flex-1 min-w-0 bg-[#F3F3F3] dark:bg-gray-900 transition-colors duration-300">
                <AppSidebar role="supervisor-akademik" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-12 xl:px-24 pt-6 sm:pt-8 pb-8">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push("/supervisor-akademik/dashboard")}>
                            Dasbor
                        </span>
                        <span className="mx-2">/</span>
                        <span className="text-gray-800 dark:text-white font-medium">Penerima</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold mb-1 dark:text-white">Penerima</h1>
                    <p className="mb-4 sm:mb-6 text-sm text-gray-500 dark:text-gray-400">Penerima</p>

                    {/* Filter Panel */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-4 sm:p-6 mb-4 sm:mb-6 transition-colors duration-300">
                        <h2 className="font-semibold mb-4 sm:mb-6 text-base sm:text-lg text-gray-900 dark:text-white">Filter Pencarian</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {/* Informasi Pemohon */}
                            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md dark:shadow-gray-900/50 overflow-hidden transition-colors duration-300">
                                <div className="bg-[#0EA5E9] dark:bg-blue-600 text-white px-4 py-3">
                                    <h3 className="font-medium text-sm">Informasi Pemohon</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 font-medium">Nama Pemohon</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-200 bg-white dark:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-colors"
                                            placeholder="Masukkan nama pemohon"
                                            value={namaPemohon}
                                            onChange={(e) => setNamaPemohon(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 font-medium">Prodi/Departemen</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-200 appearance-none bg-white dark:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-colors"
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
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-200 bg-white dark:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-colors"
                                            placeholder="Masukkan nomor surat/agenda"
                                            value={nomorSurat}
                                            onChange={(e) => setNomorSurat(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Informasi Surat */}
                            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md dark:shadow-gray-900/50 overflow-hidden transition-colors duration-300">
                                <div className="bg-[#0EA5E9] dark:bg-blue-600 text-white px-4 py-3">
                                    <h3 className="font-medium text-sm">Informasi Surat</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 font-medium">Jenis Surat</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-200 bg-white dark:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-colors"
                                            placeholder="Contoh: Keterangan Masih Kuliah"
                                            value={jenisSurat}
                                            onChange={(e) => setJenisSurat(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Periode Waktu */}
                            <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md dark:shadow-gray-900/50 overflow-hidden transition-colors duration-300">
                                <div className="bg-[#0EA5E9] dark:bg-blue-600 text-white px-4 py-3">
                                    <h3 className="font-medium text-sm">Periode Waktu</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 font-medium">Tanggal Diterima</label>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-600 transition-colors">
                                            <input
                                                type="date"
                                                className="flex-1 text-sm text-gray-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-200 outline-none bg-transparent"
                                                placeholder="Start date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                            />
                                            <span className="hidden sm:inline text-gray-400 dark:text-gray-500">→</span>
                                            <input
                                                type="date"
                                                className="flex-1 text-sm text-gray-500 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-200 outline-none bg-transparent"
                                                placeholder="End date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4 sm:mt-6">
                            <button
                                onClick={handleReset}
                                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/50 p-4 sm:p-6 transition-colors duration-300">

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {isLoading ? (
                                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Memuat data...</span>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="py-8 text-center text-red-500 dark:text-red-400">{error}</div>
                            ) : pagedRows.length === 0 ? (
                                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                                    Tidak ada surat masuk yang menunggu verifikasi
                                </div>
                            ) : pagedRows.map((row) => (
                                <div key={row.letterId} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2 bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex justify-between items-start">
                                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{row.id}</span>
                                        <span className="flex items-center gap-1.5 text-xs font-medium">
                                            <span className="w-2 h-2 rounded-full" style={{ background: row.statusColor }} />
                                            {row.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{row.perihal}</p>
                                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
                                        <span>Pemohon: <span className="text-gray-900 dark:text-gray-200">{row.pengirim}</span></span>
                                        <span>Tanggal: <span className="text-gray-900 dark:text-gray-200">{row.tglLabel}</span></span>
                                        <span>Tujuan: <span className="text-gray-900 dark:text-gray-200">{row.tujuan}</span></span>
                                        <span>Sumber: <span className="text-gray-900 dark:text-gray-200">{row.sumber}</span></span>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/supervisor-akademik/penerima/identitas-pemohon?id=${row.letterId}`)}
                                        className="w-full mt-2 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                    >
                                        Lihat Detail
                                    </button>
                                </div>
                            ))}
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
                                                    <svg className="animate-spin h-5 w-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
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
                                                Tidak ada surat masuk yang menunggu verifikasi
                                            </td>
                                        </tr>
                                    ) : pagedRows.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="py-2 px-2 font-mono text-gray-900 dark:text-gray-100">{row.id}</td>
                                            <td className="py-2 px-2">
                                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-xs">{row.sumber}</span>
                                            </td>
                                            <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.pengirim}</td>
                                            <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.perihal}</td>
                                            <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.tglLabel}</td>
                                            <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{row.tujuan}</td>
                                            <td className="py-2 px-2">
                                                <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                                    <span className="w-2 h-2 rounded-full" style={{ background: row.statusColor }} />
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-2">
                                                <button
                                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 p-1 rounded transition-colors"
                                                    title="Lihat Detail"
                                                    onClick={() => router.push(`/supervisor-akademik/penerima/identitas-pemohon?id=${row.letterId}`)}
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
                                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent outline-none cursor-pointer transition-colors"
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
                                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
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
                                                className={`border border-gray-300 dark:border-gray-600 rounded px-2 py-1 transition-colors ${isActive
                                                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                                                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                    }`}
                                                onClick={() => setPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button
                                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
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
