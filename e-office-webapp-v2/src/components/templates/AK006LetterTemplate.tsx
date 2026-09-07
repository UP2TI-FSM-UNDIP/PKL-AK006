import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate, sanitizeFileUrl } from '@/lib/helpers';
import { ProfileData } from '@/context/AK006';
import type { AK006TemplateConfig } from '@/lib/api';

// Logo path based on available files in public/template
// const LOGO_URL = "/template/logo-fsm.png"; // Unused if we use full kop image

interface AK006LetterTemplateProps {
    data: ProfileData;
    signatureUrl?: string | null;
    letterNumber?: string;
    letterDate?: string;
    letterId?: string; // Document ID for QR code verification
    status?: string; // Letter status to show QR only when COMPLETED
    showQRCode?: boolean; // Control QR code visibility (default: true when COMPLETED)
    templateConfig?: AK006TemplateConfig | null; // Optional template config from superadmin
}

// A component that renders the letter layout. 
// Can be used for preview on screen or printing.
export const AK006LetterTemplate = React.forwardRef<HTMLDivElement, AK006LetterTemplateProps>(
    ({ data, signatureUrl, letterNumber, letterDate, letterId, status, showQRCode = true, templateConfig }, ref) => {
        // Template config with defaults
        const tpl = {
            kementerian: templateConfig?.kementerian || "KEMENTERIAN PENDIDIKAN TINGGI, SAINS,\nDAN TEKNOLOGI",
            universitas: templateConfig?.universitas || "UNIVERSITAS DIPONEGORO",
            fakultas: templateConfig?.fakultas || "FAKULTAS SAINS DAN MATEMATIKA",
            alamat: templateConfig?.alamat || "Jalan Prof. Jacub Rais",
            kampus: templateConfig?.kampus || "Kampus Universitas Diponegoro",
            kota: templateConfig?.kota || "Tembalang, Semarang, Kode Pos 50275",
            telepon: templateConfig?.telepon || "Telp (024) 7474754 Fax (024) 76480690",
            website: templateConfig?.website || "www.fsm.undip.ac.id",
            email: templateConfig?.email || "fsm(at)undip.ac.id",
            lampiran_surat: templateConfig?.lampiran_surat || "SURAT EDARAN BERSAMA MENTERI KEUANGAN DAN KEPALA BADAN ADMINISTRASI KEPEGAWAIAN NEGARA",
            nomor_ref_1: templateConfig?.nomor_ref_1 || "SE.1.38/DJA/1.0/7/80 (NO.SE/117/80)",
            nomor_ref_2: templateConfig?.nomor_ref_2 || "19/SE/1980",
            tanggal_ref: templateConfig?.tanggal_ref || "7 JULI 1980",
            signer_name: templateConfig?.signer_name || "Lilik Maryuni, S.E., M.Si.",
            signer_nip: templateConfig?.signer_nip || "197808042001122001",
            signer_pangkat: templateConfig?.signer_pangkat || "Pembina / IVa",
            signer_jabatan: templateConfig?.signer_jabatan || "Manajer Bagian Tata Usaha",
            signer_instansi: templateConfig?.signer_instansi || "Fakultas Sains dan Matematika Universitas Diponegoro",
            letter_number_format: templateConfig?.letter_number_format || "...../UN7.F8.4/AK/.../20..",
            letter_title: templateConfig?.letter_title || "SURAT PERNYATAAN MASIH KULIAH",
            signer_atas_nama: templateConfig?.signer_atas_nama || "a.n. Dekan,",
            signer_untuk_beliau: templateConfig?.signer_untuk_beliau || "u.b. Manajer Bagian Tata Usaha,",
        };
        // Check if letter is completed (has letter number from UPA)
        const isCompleted = status === 'COMPLETED' && letterNumber && letterNumber.trim() !== '';

        const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

        // Generate verification URL for QR code
        const verificationUrl = letterId
            ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}${BASE_PATH}/verify/${letterId}`
            : null;

        // Helper to get current academic year/semester if needed, or placeholders
        const yearNow = new Date().getFullYear();
        const academicYear = data.tahun_akademik || `${yearNow}/${yearNow + 1}`;
        const semesterText = data.semester ? (data.semester % 2 === 1 ? 'Ganjil' : 'Genap') : '.............';

        // Derive enrollment academic year from NIM (first 2 digits = entry year)
        const nimYearDigits = data.nim && data.nim.length >= 2 ? parseInt(data.nim.substring(0, 2), 10) : null;
        const enrollmentAcademicYear = nimYearDigits !== null && !isNaN(nimYearDigits)
            ? `${2000 + nimYearDigits}/${2000 + nimYearDigits + 1}`
            : '......../........';

        // Format letter date for display
        const formatLetterDate = (dateString?: string) => {
            if (!dateString) return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        };

        // Format letter number for display
        const displayLetterNumber = letterNumber && letterNumber.trim() !== ''
            ? letterNumber
            : tpl.letter_number_format;

        // Helper to sanitize signature URL to use backend proxy if needed
        const sanitizedSignatureUrl = React.useMemo(() => {
            return sanitizeFileUrl(signatureUrl);
        }, [signatureUrl]);

        return (
            <div
                ref={ref}
                className="bg-white w-full mx-auto text-black relative leading-normal shadow-lg
                           origin-top print:shadow-none print:max-w-none print:scale-100"
                style={{
                    width: "210mm",
                    minHeight: "297mm",
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    padding: 0,
                    transformOrigin: 'top center',
                    fontFamily: "'Times New Roman', Times, serif",
                }}
            >
                {/* Header - Logo and University Info */}
                <div className="w-full pt-[15mm] px-[10mm] pb-[5mm]">
                    <div className="flex items-start justify-between gap-1">
                        {/* Logo - Left */}
                        <div className="flex-shrink-0" style={{ width: '125px', marginTop: '-8px' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={`${BASE_PATH}/template/Logo_Universitas_Diponegoro.png`}
                                alt="Logo Universitas Diponegoro"
                                className="w-full h-auto"
                            />
                        </div>

                        {/* University Information - Left Aligned */}
                        <div className="flex-1 text-left" style={{ paddingTop: '8px' }}>
                            <h1 className="font-normal leading-[1.15]" style={{
                                color: '#1e3a8a',
                                fontSize: '11.5pt',
                                letterSpacing: '0.3px'
                            }}>
                                {tpl.kementerian.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>
                                ))}
                            </h1>
                            <h2 className="font-bold leading-[1.15]" style={{
                                color: '#1e3a8a',
                                fontSize: '17pt',
                                marginTop: '1px',
                                letterSpacing: '0.5px'
                            }}>
                                {tpl.universitas}
                            </h2>
                            <h3 className="font-bold leading-[1.15]" style={{
                                color: '#1e3a8a',
                                fontSize: '13.5pt',
                                marginTop: '1px',
                                letterSpacing: '0.3px'
                            }}>
                                {tpl.fakultas}
                            </h3>
                        </div>

                        {/* Contact Information - Right */}
                        <div className="flex-shrink-0 text-right leading-[1.25]" style={{
                            color: '#1e3a8a',
                            fontSize: '8pt',
                            paddingTop: '4px',
                            minWidth: '165px'
                        }}>
                            <p className="m-0">{tpl.alamat}</p>
                            <p className="m-0">{tpl.kampus}</p>
                            <p className="m-0">{tpl.kota}</p>
                            <p className="m-0">{tpl.telepon}</p>
                            <p className="m-0">Laman: {tpl.website}</p>
                            <p className="m-0">Pos-el: {tpl.email}</p>
                        </div>
                    </div>
                </div>

                {/* Letter Content - With Margin */}
                <div className="px-[25mm] pb-[10mm] space-y-2">
                    {/* Letter Info Section */}
                    <div className="flex justify-between items-start text-[8pt] mt-2">
                        <div className="space-y-0.5 max-w-[85%]">
                            <div className="flex">
                                <span className="w-20 flex-shrink-0">LAMPIRAN</span>
                                <span className="uppercase">: {tpl.lampiran_surat}</span>
                            </div>

                            <div className="flex">
                                <span className="w-20 flex-shrink-0">NOMOR</span>
                                <span>: {tpl.nomor_ref_1}</span>
                            </div>

                            <div className="flex">
                                <span className="w-20 flex-shrink-0">NOMOR</span>
                                <span>: {tpl.nomor_ref_2}</span>
                            </div>

                            <div className="flex">
                                <span className="w-20 flex-shrink-0">TANGGAL</span>
                                <span className="uppercase">: {tpl.tanggal_ref}</span>
                            </div>
                        </div>
                        <div className="border border-black w-[25mm] h-[7mm] flex items-center justify-center text-[10pt] leading-none">
                            AK.006
                        </div>
                    </div>

                    {/* Letter Title */}
                    <div className="text-center mt-2 mb-1">
                        <h2 className="font-bold text-[11pt] underline">{tpl.letter_title}</h2>
                        <p className="text-[9pt] mt-0.5">
                            Nomor: <span>{displayLetterNumber}</span>
                        </p>
                    </div>

                    {/* Letter Body */}
                    <div className="text-[11pt] leading-tight space-y-1.5 text-justify">
                        <p>Yang bertanda tangan di bawah ini:</p>

                        <table className="ml-8" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '182px', verticalAlign: 'top', paddingBottom: '1px' }}>N a m a</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {tpl.signer_name}</td>
                                </tr>
                                <tr>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>N I P</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {tpl.signer_nip}</td>
                                </tr>
                                <tr>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>Pangkat / Golongan</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {tpl.signer_pangkat}</td>
                                </tr>
                                <tr>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>Jabatan</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {tpl.signer_jabatan}</td>
                                </tr>
                                <tr>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>Pada Instansi</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {tpl.signer_instansi}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p className="mt-1.5">dengan ini menyatakan dengan sesungguhnya bahwa:</p>

                        <table className="ml-8 mt-0.5" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '182px', verticalAlign: 'top', paddingBottom: '1px' }}>N a m a</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {data.nama_lengkap || "................................................................"}</td>
                                </tr>
                                <tr>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>N I M</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {data.nim || "................................................"}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p className="mt-1">
                            adalah benar sejak tahun akademik {enrollmentAcademicYear} terdaftar sebagai mahasiswa Fakultas Sains dan Matematika Universitas Diponegoro dan pada saat ini yang bersangkutan masih aktif kuliah pada:
                        </p>

                        <table className="ml-8 mt-0.5" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '182px', verticalAlign: 'top', paddingBottom: '1px' }}>Prog. Studi/Departemen/ Univ.</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {data.program_studi || data.departemen || "................................................"}</td>
                                </tr>
                                <tr>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>Semester</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {data.semester || "................................................"}</td>
                                </tr>
                                <tr>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>Tahun akademik</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {academicYear}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p className="mt-1.5">dan bahwa orang tua / wali mahasiswa tersebut adalah:</p>

                        <table className="ml-8 mt-0.5" style={{ borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '182px', verticalAlign: 'top', paddingBottom: '1px' }}>Nama</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {data.nama_ortu_wali || "................................................................"}</td>
                                </tr>
                                <tr>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>NIP</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {data.nip_pensiun_ortu_wali || "................................................"}</td>
                                </tr>
                                <tr>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>Pangkat / Golongan</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {data.golongan_ortu_wali || "................................................"}</td>
                                </tr>
                                <tr>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>Instansi</td>
                                    <td style={{ verticalAlign: 'top', paddingBottom: '1px' }}>: {data.instansi_ortu_wali || "................................................"}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p className="mt-2">
                            Demikian surat pernyataan ini dibuat dengan sesungguhnya, dan apabila di kemudian hari surat pernyataan ini tidak benar, yang mengakibatkan kerugian terhadap Negara Republik Indonesia, maka saya bersedia menanggung kerugian tersebut.
                        </p>
                    </div>

                    {/* Signature Section with QR Code */}
                    <div className="mt-6 flex justify-end items-end">
                        {/* QR Code - positioned to the left of signature, only shown when COMPLETED */}
                        {isCompleted && verificationUrl && showQRCode && (
                            <div className="flex-shrink-0 mr-4 mb-1">
                                <div className="bg-white p-0.5">
                                    <QRCodeSVG
                                        value={verificationUrl}
                                        size={55}
                                        level="M"
                                        includeMargin={false}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Signature */}
                        <div className="text-[11pt] text-left w-[250px] relative">
                            <p>Semarang, {formatLetterDate(letterDate)}</p>
                            <p className="mt-0.5">{tpl.signer_atas_nama}</p>
                            <p>{tpl.signer_untuk_beliau}</p>

                            {/* Signature Image - Centered */}
                            {sanitizedSignatureUrl && (
                                <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-48 h-28 flex items-center justify-center z-10 mix-blend-darken">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={sanitizedSignatureUrl}
                                        alt="Tanda Tangan"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            )}

                            <div className="mt-20">
                                <p className="underline">{tpl.signer_name}</p>
                                <p>NIP {tpl.signer_nip}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <p className="text-[9pt] mt-4 font-bold" style={{ color: '#dc2626' }}>
                        *) Harap melampirkan KRS semester berjalan dan KTM yang masih berlaku.
                    </p>
                </div>
            </div>
        );
    }
);

AK006LetterTemplate.displayName = "AK006LetterTemplate";
