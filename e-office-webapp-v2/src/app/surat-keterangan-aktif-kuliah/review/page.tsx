'use client';

import { useEffect, useState, Suspense } from 'react';
import { createPortal } from 'react-dom';
import PageWrapper from '@/components/layouts/PageWrapper';
import { SuratStepper } from '../components';
import FormSection from '@/components/ui/FormSection';
import { useProfile } from '@/context/AK006';
import { IdentitasPengajuRows } from '@/components/ui/IdentitasPengajuRows';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PageHeader from '@/components/ui/PageHeader';
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from 'next/navigation';

import { Check, X, Printer, Loader2, Eye, Image as ImageIcon } from 'lucide-react';
import { AK006LetterTemplate } from '@/components/templates/AK006LetterTemplate';
import { letterApi } from '@/lib/api';
import { useAK006Template } from '@/hooks/use-ak006-template';
import {
  getAttachments,
  AttachmentData,
  clearUploadedAttachments,
  clearAttachments,
} from '@/lib/indexedDB';
import { DynamicFormField } from '@/components/ui/CardUpload';
import { sanitizeFileUrl } from '@/lib/helpers';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatLabel(label: string) {
  const upperLabels = ['ktm', 'krs', 'khs', 'transkip'];
  if (upperLabels.includes(label.toLowerCase())) {
    return label.toUpperCase();
  }
  return label;
}

function ReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, mode: currentMode, letterId: contextLetterId } = useProfile();

  // NOTE: We now load the DRAFT data (File objects), not just uploaded URLs
  const [draftAttachments, setDraftAttachments] = useState<AttachmentData | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { templateConfig, loading: templateLoading } = useAK006Template();

  // Revision confirmation state
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  // Get query params for revision mode
  const letterIdParam = searchParams.get('letterId');
  const modeParam = searchParams.get('mode') as 'revision' | 'self-revise' | null;
  const isRevisionMode = modeParam === 'revision' || modeParam === 'self-revise' || currentMode !== 'create';
  const effectiveLetterId = letterIdParam || contextLetterId;

  // Query params to preserve in navigation
  const queryParams = letterIdParam && modeParam
    ? `?letterId=${letterIdParam}&mode=${modeParam}`
    : '';

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      // Load the draft attachments (containing File objects)
      const data = await getAttachments();
      setDraftAttachments(data);
    };
    loadData();
  }, []);

  // Updated render function to handle DynamicFormField
  const renderAttachmentItem = (field: DynamicFormField) => {
    const file = field.metadata.file;
    const uploadedData = field.metadata.uploadedData;

    // Determine display values
    const originalName = uploadedData?.originalName || file?.name || field.value;
    const size = uploadedData?.size || file?.size || 0;
    const label = field.label || field.value;
    const uniqueKey = uploadedData?.url || field.metadata.id;

    const handleView = () => {
      if (uploadedData?.url) {
        window.open(sanitizeFileUrl(uploadedData.url), '_blank');
      } else if (file) {
        // Create a temporary object URL for viewing the draft file
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
        // Note: In a real persistent app we might want to revoke this later, 
        // but for a one-off view action it's acceptable.
      }
    };

    return (
      <div key={uniqueKey} className='flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md dark:hover:shadow-blue-900/10 transition-all duration-300'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0'>
            <ImageIcon size={24} />
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs' title={originalName}>
              {originalName}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
              {formatBytes(size)}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2 sm:gap-4'>
          <div className='hidden sm:flex px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-600 dark:text-gray-300 items-center justify-between gap-2 min-w-[80px]'>
            <span>{formatLabel(label)}</span>
          </div>

          <div className='flex items-center gap-1 sm:gap-2'>
            <button
              onClick={handleView}
              className='p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors'
              title="Lihat File"
              type="button"
            >
              <Eye size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}/${currentYear + 1}`;

    const letterData = {
      keperluan: profile.keperluan_surat || 'Keperluan umum',
      semester: profile.semester || 1,
      tahunAkademik: profile.tahun_akademik || '-',
      // Include identity fields that user may have edited
      nama_lengkap: profile.nama_lengkap || '',
      nim: profile.nim || '',
      email: profile.email || '',
      departemen: profile.departemen || '',
      program_studi: profile.program_studi || '',
      tempat_lahir: profile.tempat_lahir || '',
      tanggal_lahir: profile.tanggal_lahir || '',
      no_hp: profile.no_hp || '',
      alamat: profile.alamat || '',
      // Include parent/guardian fields (for AK006 letter template)
      nama_ortu_wali: profile.nama_ortu_wali || '',
      nip_pensiun_ortu_wali: profile.nip_pensiun_ortu_wali || '',
      golongan_ortu_wali: profile.golongan_ortu_wali || '',
      instansi_ortu_wali: profile.instansi_ortu_wali || '',
    };

    try {
      // 1. UPLOAD FILES FIRST
      // We iterate through our draft attachments and upload any that aren't already uploaded.

      console.log('=== PROCESSING ATTACHMENTS ===');
      console.log('Draft Attachments:', draftAttachments);
      console.log('Mandatory fields:', draftAttachments?.mandatory?.map(f => ({
        label: f.label,
        hasFile: !!f.metadata.file,
        hasUploadedData: !!f.metadata.uploadedData,
      })));
      console.log('Optional fields:', draftAttachments?.optional?.map(f => ({
        label: f.label,
        hasFile: !!f.metadata.file,
        hasUploadedData: !!f.metadata.uploadedData,
      })));

      const processFields = async (fields: DynamicFormField[], category: 'mandatory' | 'optional') => {
        return Promise.all(
          fields.map(async (field) => {
            // If field has uploadedData AND no new file to upload, use existing data
            if (field.metadata.uploadedData && !field.metadata.file) {
              console.log(`Using existing uploaded file: ${field.label}`, field.metadata.uploadedData);
              return {
                url: field.metadata.uploadedData.url,
                filename: field.metadata.uploadedData.filename,
                originalName: field.metadata.uploadedData.originalName || field.value,
                mimeType: field.metadata.uploadedData.mimeType,
                size: field.metadata.uploadedData.size,
                label: field.label || field.value,
                category: category,
              };
            }

            // If field has a new file to upload
            if (field.metadata.file) {
              // Check if it's a real file with content (not a mock file)
              const isRealFile = field.metadata.file instanceof File &&
                field.metadata.file.size > 0 &&
                field.metadata.file.name;

              if (!isRealFile) {
                console.warn(`Field ${field.label} has mock file - checking for uploadedData`);
                // If it has uploadedData, return it even though file exists (it's a mock)
                if (field.metadata.uploadedData) {
                  console.log(`Using uploadedData for mock file: ${field.label}`);
                  return {
                    url: field.metadata.uploadedData.url,
                    filename: field.metadata.uploadedData.filename,
                    originalName: field.metadata.uploadedData.originalName || field.value,
                    mimeType: field.metadata.uploadedData.mimeType,
                    size: field.metadata.uploadedData.size,
                    label: field.label || field.value,
                    category: category,
                  };
                }
                console.warn(`Mock file without uploadedData - returning null`);
                return null;
              }

              console.log(`Uploading new real file: ${field.label}`, {
                name: field.metadata.file.name,
                size: field.metadata.file.size,
                type: field.metadata.file.type
              });
              try {
                const res = await letterApi.uploadFile(field.metadata.file, 'lampiran/');
                if (res.success && res.data) {
                  console.log(`Upload successful for ${field.label}:`, res.data);
                  return {
                    url: res.data.url,
                    filename: res.data.filename,
                    originalName: res.data.originalName,
                    mimeType: res.data.mimeType,
                    size: res.data.size,
                    label: field.label || field.value,
                    category: category,
                  };
                } else {
                  console.error(`Upload failed for ${field.label}:`, res.message);
                  throw new Error(`Gagal mengupload ${field.label}: ${res.message || 'Error tidak diketahui'}`);
                }
              } catch (err: any) {
                console.error('Upload failed for', field.label, err);
                throw err; // Propagate the error to be caught by the outer try-catch
              }
            }

            console.warn(`Field ${field.label} has no file and no uploadedData - returning null`);
            return null;
          })
        );
      };

      const mandatoryResults = await processFields(draftAttachments?.mandatory || [], 'mandatory');

      console.log('=== UPLOAD RESULTS ===');
      console.log('Mandatory results:', mandatoryResults);

      const uploadedMandatory = mandatoryResults.filter(Boolean);

      console.log('Uploaded mandatory count:', uploadedMandatory.length);
      console.log('Uploaded mandatory:', uploadedMandatory);

      // Validate again just in case
      if (uploadedMandatory.length < 2) {
        console.error('VALIDATION FAILED: Not enough mandatory files');
        console.error('Required: 2, Got:', uploadedMandatory.length);
        throw new Error('Gagal mengupload file wajib. Silakan coba lagi.');
      }

      // 2. PREPARE SUBMISSION PAYLOAD
      const allAttachments = [...uploadedMandatory];

      const submissionData = {
        ...letterData,
        comments: isRevisionMode ? revisionNote : undefined,
        attachments: allAttachments.map((att: any) => ({
          url: att.url,
          // Prefix filename with category tag for identification on retrieval
          filename: `[${att.category}]_[${att.label || 'file'}]_${att.filename}`,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
        })),
      };

      console.log('--- FINAL SUBMISSION DATA ---');
      console.log(JSON.stringify(submissionData, null, 2));

      let response;

      if (isRevisionMode && effectiveLetterId) {
        response = await letterApi.updateLetter(effectiveLetterId, submissionData);
      } else {
        response = await letterApi.createLetter(submissionData);
      }

      if (response.success) {
        // Clear all draft data after successful submission
        localStorage.removeItem('user_profile');
        localStorage.removeItem('reached_step');
        await clearUploadedAttachments(); // Clear old URL cache
        await clearAttachments(); // Clear draft files

        router.push('/mahasiswa/surat-saya');
      } else {
        setSubmitError(response.message || 'Gagal mengajukan surat. Silakan coba lagi.');
      }
    } catch (err: any) {
      console.error('Error submitting letter:', err);
      setSubmitError(err.message || 'Gagal mengajukan surat. Pastikan koneksi intenet stabil.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 py-5.5 transition-colors duration-300">
      <Breadcrumbs
        parents={[{ label: 'Home' }, { label: 'AK-006' }]}
        currentPage={isRevisionMode ? 'Revisi - Review & Ajukan' : 'Review & Ajukan'}
      />
      <PageWrapper>
        <PageHeader
          title={isRevisionMode ? 'Review Revisi Surat' : 'Review Surat'}
          description={isRevisionMode
            ? 'Periksa kembali data yang telah Anda perbaiki sebelum mengajukan ulang surat.'
            : 'Mohon periksa kembali seluruh data yang telah Anda masukkan sebelum mengajukan surat.'
          }
        />
        <SuratStepper Value={4} />

        <FormSection title='Identitas Pengaju' className='md:grid-cols-1'>
          <IdentitasPengajuRows
            rows={[
              { label: 'Nama Lengkap', value: profile.nama_lengkap },
              { label: 'NIM/NIP', value: profile.nim },
              { label: 'Email', value: profile.email },
              { label: 'Departemen', value: profile.departemen },
              { label: 'Program Studi', value: profile.program_studi },
              { label: 'Tempat Lahir', value: profile.tempat_lahir || '-' },
              { label: 'Tanggal Lahir', value: profile.tanggal_lahir || '-' },
              { label: 'No. HP', value: profile.no_hp },
              { label: 'Alamat', value: profile.alamat },
            ]}
          />
        </FormSection>

        <FormSection title='Detail Surat Pengajuan' className='md:grid-cols-1'>
          <IdentitasPengajuRows
            rows={[
              { label: 'Jenis Surat', value: profile.jenis_surat || 'AK006 | Surat Peminjaman Balai Kuliah' },
              { label: 'Nama Orang Tua', value: profile.nama_ortu_wali || 'tidak ada' },
              { label: 'NIP / Pekerjaan Orang Tua', value: profile.nip_pensiun_ortu_wali || 'tidak ada' },
              { label: 'Pangkat / Golongan', value: profile.golongan_ortu_wali || 'N/A' },
              { label: 'Instansi', value: profile.instansi_ortu_wali || 'Fakultas Sains dan Matematika Universitas Diponegoro' },
            ]}
          />
        </FormSection>

        <FormSection title='Checklist Kesiapan' className='md:grid-cols-1'>
          <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3 transition-colors duration-300'>
            <div className='flex items-center gap-3 text-green-700 dark:text-green-400'>
              <div className='flex-shrink-0 w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-white' strokeWidth={3} />
              </div>
              <span className='text-sm font-medium'>Data terisi lengkap</span>
            </div>
            <div className='flex items-center gap-3 text-green-700 dark:text-green-400'>
              <div className='flex-shrink-0 w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center'>
                <Check className='w-4 h-4 text-white' strokeWidth={3} />
              </div>
              <span className='text-sm font-medium'>Lampiran sudah ada</span>
            </div>
          </div>
        </FormSection>

        <FormSection title='Lampiran' className='md:grid-cols-1'>
          <div className='space-y-4'>
            {draftAttachments?.mandatory && draftAttachments.mandatory.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Wajib</h4>
                {draftAttachments.mandatory.map((field) => renderAttachmentItem(field))}
              </div>
            )}



            {(!draftAttachments?.mandatory || draftAttachments.mandatory.length === 0) &&
              (!draftAttachments?.optional || draftAttachments.optional.length === 0) && (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 transition-colors duration-300">
                  <p className='text-sm text-gray-500 dark:text-gray-400'>Tidak ada lampiran yang dipilih.</p>
                </div>
              )}
          </div>
        </FormSection>

        <div className='flex flex-col gap-4 mt-6'>
          {submitError && (
            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm transition-colors duration-300'>
              {submitError}
            </div>
          )}
          <div className='flex justify-between items-center'>
            <button
              onClick={() => router.push(`/surat-keterangan-aktif-kuliah/lampiran${queryParams}`)}
              disabled={isSubmitting}
              className='px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50'
            >
              Kembali
            </button>
            <div className='flex gap-3'>
              <button
                onClick={() => setShowPreview(true)}
                disabled={isSubmitting}
                className='px-8 py-2.5 border border-[#0EA5E9] dark:border-blue-500 text-[#0EA5E9] dark:text-blue-400 bg-white dark:bg-gray-800 rounded-lg font-medium text-sm hover:bg-[#0EA5E9]/10 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50'
              >
                Preview Surat
              </button>
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={isSubmitting}
                className='px-8 py-2.5 bg-[#0EA5E9] dark:bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span>{isRevisionMode ? 'Mengajukan ulang...' : 'Mengajukan...'}</span>
                  </>
                ) : (
                  isRevisionMode ? 'Ajukan Ulang' : 'Ajukan Surat'
                )}
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>

      {/* Preview Modal Portal */}
      {showPreview && mounted && createPortal(
        <div id="print-overlay" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-300">
            {/* Modal Header - Hidden when printing */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 no-print transition-colors duration-300">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pratinjau Surat</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pastikan data sudah benar sebelum mencetak.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium shadow-sm"
                >
                  <Printer size={18} />
                  Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 flex justify-center transition-colors duration-300">
              <div className="bg-white shadow-lg print:shadow-none print:w-full overflow-x-auto max-w-full">
                <AK006LetterTemplate data={profile} templateConfig={templateConfig} />
              </div>
            </div>
          </div>

          <style jsx global>{`
            @media print {
              /* Hide everything in the body except our print overlay */
              body > *:not(#print-overlay) {
                display: none !important;
              }
              
              body {
                margin: 0 !important;
                padding: 0 !important;
              }
              
              /* Reset the overlay to fill the page */
              #print-overlay {
                position: static !important;
                inset: auto !important;
                width: 100% !important;
                height: auto !important;
                min-height: 100vh !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
                overflow: visible !important;
              }
              
              /* Reset modal container */
              #print-overlay > div {
                max-width: 100% !important;
                max-height: none !important;
                width: 100% !important;
                height: auto !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                overflow: visible !important;
                display: block !important;
              }

              /* Hide the modal UI elements (header, close buttons, scrollbars) */
              .no-print {
                display: none !important;
              }

              /* Target the content to flow naturally */
              .overflow-y-auto {
                overflow: visible !important;
                height: auto !important;
                min-height: auto !important;
                max-height: none !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
              }

              /* Ensure the letter template takes full width/height as needed */
              .bg-white {
                box-shadow: none !important;
                max-width: 100% !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
              }
              
              @page {
                size: A4 portrait;
                margin: 0;
              }
              
              /* Prevent unwanted breaks */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
              }
              
              img {
                page-break-inside: avoid;
              }
            }
          `}</style>
        </div>,
        document.body
      )}

      {/* Confirmation Modal (Submit & Revision) */}
      {showConfirmSubmit && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transition-colors duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white">
                {isRevisionMode ? 'Konfirmasi Pengajuan Revisi' : 'Konfirmasi Pengajuan Surat'}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                {isRevisionMode
                  ? 'Apakah Anda yakin data perbaikan sudah benar? Pastikan semua revisi yang diminta telah Anda lengkapi.'
                  : 'Apakah Anda yakin ingin mengajukan surat ini? Pastikan seluruh data yang Anda masukkan sudah benar.'}
              </p>

              {isRevisionMode && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catatan Revisi (Opsional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm h-24 resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Tuliskan catatan perbaikan atau respon revisi Anda di sini untuk memudahkan pemeriksaan..."
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    handleSubmit();
                  }}
                  className="px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm"
                >
                  {isRevisionMode ? 'Ya, Ajukan Revisi' : 'Ya, Ajukan Surat'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <ReviewPageContent />
    </Suspense>
  );
}
