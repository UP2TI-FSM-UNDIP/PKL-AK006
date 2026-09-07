'use client';
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

// UI components
import FormSection from '@/components/ui/FormSection';
import CardUpload, { DynamicFormField } from '@/components/ui/CardUpload';
import PageWrapper from '@/components/layouts/PageWrapper';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

// Local components
import { SuratStepper } from '@/app/surat-keterangan-aktif-kuliah/components';

// State Management
import { useProfile } from '@/context/AK006';
import {
  AttachmentData,
  getAttachments,
  saveAttachments,
  saveUploadedAttachments,
  UploadedAttachment,
} from '@/lib/indexedDB';
import PageHeader from '@/components/ui/PageHeader';
import { Loader2 } from 'lucide-react';
import { letterApi } from '@/lib/api';

function PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // (CONTEXT) Ambil data & fungsi dari Context
  const { saveAndNext, mode: currentMode } = useProfile();

  // Get query params for revision mode
  const letterIdParam = searchParams.get('letterId');
  const modeParam = searchParams.get('mode') as 'revision' | 'self-revise' | null;
  const isRevisionMode = modeParam === 'revision' || modeParam === 'self-revise' || currentMode !== 'create';

  // Query params to preserve in navigation
  const queryParams = letterIdParam && modeParam
    ? `?letterId=${letterIdParam}&mode=${modeParam}`
    : '';

  const mandatoryOptions = ['KTM', 'KRS'];

  // Local state for files being edited
  const [lampiran, setLampiran] = useState<AttachmentData>({
    mandatory: [],
    optional: [],
  });

  // Load initial data from IndexedDB or API (for revision mode)
  // Load initial data from IndexedDB or API (for revision mode)
  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Always try to load from IndexedDB first to preserve local edits
      const savedAttachments = await getAttachments();
      if (savedAttachments) {
        console.log('Using draft attachments from IndexedDB');
        setLampiran(savedAttachments);
        return;
      }

      // 2. If IndexedDB is empty/null, and we are in revision mode, fetch from API
      if (letterIdParam && modeParam && (modeParam === 'revision' || modeParam === 'self-revise')) {
        try {
          const response = await letterApi.getLetterById(letterIdParam);
          console.log('=== FETCH LETTER DATA FOR REVISION ===');
          console.log('Response:', response);

          if (response.success && response.data?.attachments) {
            const existingAttachments = response.data.attachments;
            console.log('Existing Attachments:', existingAttachments);

            // Map existing attachments to match the CardUpload format
            const mandatoryFields: DynamicFormField[] = [];
            const optionalFields: DynamicFormField[] = [];

            existingAttachments.forEach((att) => {
              // Extract category and label from filename if it was tagged
              // Format: [category]_[label]_actualFilename
              let category = 'optional';
              let label = att.originalName || att.filename;

              const filenameMatch = att.filename.match(/^\[(\w+)\]_\[([^\]]+)\]_(.+)$/);
              if (filenameMatch) {
                category = filenameMatch[1]; // 'mandatory' or 'optional'
                label = filenameMatch[2]; // 'KTM', 'KRS', etc.
              }

              const field: DynamicFormField = {
                label: label,
                value: att.originalName || att.filename,
                datatype: 'file',
                validation: category === 'mandatory' ? 'REQUIRED' : 'OPTIONAL',
                metadata: {
                  id: att.id,
                  status: 'completed' as const,
                  size: att.size || 0,
                  file: undefined,
                  uploadedData: {
                    url: att.url,
                    filename: att.filename,
                    originalName: att.originalName,
                    mimeType: att.mimeType,
                    size: att.size,
                  },
                },
              };

              if (category === 'mandatory') {
                mandatoryFields.push(field);
              } else {
                optionalFields.push(field);
              }
            });

            console.log('Mapped Mandatory Fields:', mandatoryFields);
            console.log('Mapped Optional Fields:', optionalFields);

            const initialData = {
              mandatory: mandatoryFields,
              optional: optionalFields,
            };

            setLampiran(initialData);

            // Save to IndexedDB to ensure consistency correctly
            await saveAttachments(initialData);

            return;
          }
        } catch (error) {
          console.error('Error loading attachments from API:', error);
        }
      }
    };
    loadInitialData();
  }, [letterIdParam, modeParam]);

  const handleMandatoryUpdate = (fields: DynamicFormField[]) => {
    console.log('=== Lampiran Page: handleMandatoryUpdate ===');
    console.log('New mandatory fields count:', fields.length);
    console.log('Fields:', fields.map(f => ({ id: f.metadata.id, label: f.label })));

    setLampiran((prev) => {
      console.log('Previous mandatory count:', prev.mandatory.length);
      console.log('Previous optional count:', prev.optional.length);
      return {
        ...prev,
        mandatory: fields,
      };
    });
  };

  // Save draft to IndexedDB and proceed (Upload happens on Review page)
  const handleNext = async () => {
    console.log('=== HANDLE NEXT CLICKED ===');

    // VALIDATION: Check if mandatory files are selected
    const mandatorySelected = lampiran.mandatory.filter(
      (f) => (f.value || f.metadata.file)
    );

    if (mandatorySelected.length < 2) {
      setShowErrors(true);
      setUploadError('Wajib mengupload 2 file (KTM dan KRS) sebelum melanjutkan.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      // Only save draft state with File objects
      // Actual upload will happen on the Review page
      await saveAttachments(lampiran);

      console.log('Draft files saved to IndexedDB');

      saveAndNext({}, 2);
      router.push(`/surat-keterangan-aktif-kuliah/review${queryParams}`);
    } catch (error: any) {
      console.error('Error in handleNext:', error);
      setUploadError(error.message || 'Terjadi kesalahan saat menyimpan');
      setShowErrors(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300'>
      <Breadcrumbs
        parents={[{ label: 'Home' }, { label: 'AK-006' }]}
        currentPage={isRevisionMode ? 'Revisi - Lampiran' : 'Lampiran'}
      />
      <PageWrapper className='max-w-4xl m-auto pt-12 pr-4 pb-2 pl-4'>
        <PageHeader
          title={isRevisionMode ? 'Revisi Surat - Lampiran' : 'Lampiran'}
          description={isRevisionMode
            ? 'Perbaiki lampiran dokumen surat Anda sesuai catatan dari verifikator.'
            : 'Lampirkan dokumen pendukung yang diperlukan.'
          }
        />
        <SuratStepper Value={3} />
        <FormSection
          className='md:grid-cols-1'
          title={
            <>
              Lampiran Utama <span className='text-red-500 dark:text-red-400'>*</span>
            </>
          }
          description='Wajib. Unggah KTM dan KRS (berjalan). Format: PDF, JPG, PNG. Maks: 5MB/file.'
        >
          <CardUpload
            onFilesChange={handleMandatoryUpdate}
            dropdownOptions={mandatoryOptions}
            maxFiles={mandatoryOptions.length}
            initialFields={lampiran.mandatory}
            isMandatory={true}
            simulateUpload={false}
            uploadImmediately={false}
            uploadCategory="lampiran/"
          />
          {showErrors &&
            lampiran.mandatory.length !== mandatoryOptions.length && (
              <p className='text-xs text-red-500 dark:text-red-400'>
                Seluruh file wajib diunggah.
              </p>
            )}
        </FormSection>



        {uploadError && (
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4 transition-colors duration-300'>
            {uploadError}
          </div>
        )}
        <div className='flex justify-between items-center mt-6'>
          <button
            onClick={async () => {
              // Save attachments to IndexedDB before navigating back
              await saveAttachments(lampiran);
              router.push(`/surat-keterangan-aktif-kuliah/detail-pengajuan${queryParams}`);
            }}
            disabled={isSubmitting}
            className='px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50'
          >
            Kembali
          </button>
          <div className='flex gap-3'>
            {!isRevisionMode && (
              <button
                onClick={() => console.log('Simpan draft')}
                disabled={isSubmitting}
                className='px-8 py-2.5 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-lg font-medium text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50'
              >
                Simpan Draft
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className='px-8 py-2.5 bg-[#0EA5E9] dark:bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span>Mengupload...</span>
                </>
              ) : (
                'Lanjut'
              )}
            </button>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <PageContent />
    </Suspense>
  );
}
