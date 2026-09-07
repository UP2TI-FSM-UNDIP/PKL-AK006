'use client';
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from 'next/navigation';
import { useProfile } from '@/context/AK006';
import { useState, useEffect, useRef, Suspense } from 'react';
import { letterApi, referenceApi } from '@/lib/api';
import { Loader2, AlertTriangle } from 'lucide-react';
import { clearAttachments, clearUploadedAttachments, saveAttachments, AttachmentData } from '@/lib/indexedDB';
import { DynamicFormField } from '@/components/ui/CardUpload';
import { searchCities, isValidCity } from '@/lib/indonesianCities';

// UI Components
import FormSection from '@/components/ui/FormSection';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import PageWrapper from '@/components/layouts/PageWrapper';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PageHeader from '@/components/ui/PageHeader';

// Local Components
import { SuratStepper } from '@/app/surat-keterangan-aktif-kuliah/components';
import { FormError } from '@/components/FormSurat/FormError';

function PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, saveAndNext, setRevisionMode, mode: currentMode, letterId: currentLetterId, reachedStep, resetReachedStep } = useProfile();
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [revisionComment, setRevisionComment] = useState<string>('');

  // Lockable fields: all locked by default, user must click "Ubah" + confirm warning to edit
  type LockableField = 'nama' | 'email' | 'nim' | 'departemen' | 'prodi' | 'tempat_lahir' | 'tanggal_lahir';
  const [editableFields, setEditableFields] = useState<Record<LockableField, boolean>>({
    nama: false, email: false, nim: false, departemen: false, prodi: false, tempat_lahir: false, tanggal_lahir: false,
  });
  const [warningField, setWarningField] = useState<LockableField | null>(null);

  // Snapshots: store original values when a field is unlocked, so we can revert on cancel
  const [fieldSnapshots, setFieldSnapshots] = useState<Record<string, string>>({});

  const fieldLabels: Record<LockableField, string> = {
    nama: 'Nama Lengkap', email: 'Email', nim: 'NIM',
    departemen: 'Departemen', prodi: 'Program Studi',
    tempat_lahir: 'Tempat Lahir', tanggal_lahir: 'Tanggal Lahir',
  };

  // Map LockableField keys to formData keys
  const fieldToFormKey: Record<LockableField, string> = {
    nama: 'nama_lengkap', email: 'email', nim: 'nim',
    departemen: 'departemen', prodi: 'program_studi',
    tempat_lahir: 'tempat_lahir', tanggal_lahir: 'tanggal_lahir',
  };

  const unlockField = (field: LockableField) => {
    // Snapshot current values before unlocking
    const formKey = fieldToFormKey[field];
    const snapshots: Record<string, string> = { [formKey]: (formData as any)[formKey] || '' };
    // For departemen/prodi, also snapshot the dropdown IDs
    if (field === 'departemen') {
      snapshots['_selectedDepartemenId'] = selectedDepartemenId;
    }
    if (field === 'prodi') {
      snapshots['_selectedProdiId'] = selectedProdiId;
    }
    setFieldSnapshots(prev => ({ ...prev, ...snapshots }));
    setEditableFields(prev => ({ ...prev, [field]: true }));
    setWarningField(null);
  };

  const lockField = (field: LockableField) => {
    setEditableFields(prev => ({ ...prev, [field]: false }));
  };

  const cancelField = (field: LockableField) => {
    const formKey = fieldToFormKey[field];
    const originalValue = fieldSnapshots[formKey];
    if (originalValue !== undefined) {
      setFormData(prev => ({ ...prev, [formKey]: originalValue }));
    }
    // Restore dropdown IDs for departemen/prodi
    if (field === 'departemen' && fieldSnapshots['_selectedDepartemenId'] !== undefined) {
      setSelectedDepartemenId(fieldSnapshots['_selectedDepartemenId']);
      // Also reload prodi list for original departemen
      if (fieldSnapshots['_selectedDepartemenId']) {
        referenceApi.getProgramStudi(fieldSnapshots['_selectedDepartemenId']).then(res => {
          if (res.success && res.data) setProdiList(res.data);
        });
      }
    }
    if (field === 'prodi' && fieldSnapshots['_selectedProdiId'] !== undefined) {
      setSelectedProdiId(fieldSnapshots['_selectedProdiId']);
    }
    setEditableFields(prev => ({ ...prev, [field]: false }));
  };

  // PKL-143: Departemen & Prodi dropdowns
  const [departemenList, setDepartemenList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [prodiList, setProdiList] = useState<{ id: string; name: string; code: string; departemenId: string }[]>([]);
  const [selectedDepartemenId, setSelectedDepartemenId] = useState('');
  const [selectedProdiId, setSelectedProdiId] = useState('');

  // PKL-142: Tempat Lahir autocomplete
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLDivElement>(null);

  // Get query params
  const letterIdParam = searchParams.get('letterId');
  const modeParam = searchParams.get('mode') as 'revision' | 'self-revise' | null;

  // Local State Batching
  const [formData, setFormData] = useState({
    nama_lengkap: profile.nama_lengkap || '',
    nim: profile.nim || '',
    email: profile.email || '',
    no_hp: profile.no_hp || '',
    alamat: profile.alamat || '',
    departemen: profile.departemen || '',
    program_studi: profile.program_studi || '',
    tempat_lahir: profile.tempat_lahir || '',
    tanggal_lahir: profile.tanggal_lahir || '',
  });

  // Load departemen & prodi on mount
  useEffect(() => {
    const loadDepartemenData = async () => {
      try {
        const res = await referenceApi.getDepartemen();
        if (res.success && res.data) {
          setDepartemenList(res.data);
          // Auto-select departemen if profile has one
          if (formData.departemen) {
            const match = res.data.find(d => d.name === formData.departemen);
            if (match) {
              setSelectedDepartemenId(match.id);
              // Load prodi for this departemen
              const prodiRes = await referenceApi.getProgramStudi(match.id);
              if (prodiRes.success && prodiRes.data) {
                setProdiList(prodiRes.data);
                // Auto-select prodi if profile has one
                if (formData.program_studi) {
                  const prodiMatch = prodiRes.data.find(p => p.name === formData.program_studi);
                  if (prodiMatch) {
                    setSelectedProdiId(prodiMatch.id);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading departemen:', err);
      }
    };
    loadDepartemenData();
  }, []);

  // Sync form data with profile changes (e.g. after hydration or API fetch)
  useEffect(() => {
    // Only auto-fill if the form fields are currently empty or it's a fresh load (reachedStep 0)
    // and we have profile data from the DB/context
    if (profile.nama_lengkap) {
      setFormData(prev => ({
        ...prev,
        nama_lengkap: prev.nama_lengkap || profile.nama_lengkap || '',
        nim: prev.nim || profile.nim || '',
        email: prev.email || profile.email || '',
        no_hp: prev.no_hp || profile.no_hp || '',
        alamat: prev.alamat || profile.alamat || '',
        departemen: prev.departemen || profile.departemen || '',
        program_studi: prev.program_studi || profile.program_studi || '',
        tempat_lahir: prev.tempat_lahir || profile.tempat_lahir || '',
        tanggal_lahir: prev.tanggal_lahir || profile.tanggal_lahir || '',
      }));
    }
  }, [profile]);

  // When departemen changes, resync selected dropdown ID AND load prodi list
  useEffect(() => {
    if (formData.departemen && departemenList.length > 0) {
      const match = departemenList.find(d => d.name === formData.departemen);
      if (match && match.id !== selectedDepartemenId) {
        setSelectedDepartemenId(match.id);
        // Also load prodi for this departemen (needed when profile hydrates after mount)
        const loadProdiForDept = async () => {
          try {
            const prodiRes = await referenceApi.getProgramStudi(match.id);
            if (prodiRes.success && prodiRes.data) {
              setProdiList(prodiRes.data);
              // Auto-select prodi if formData has one
              if (formData.program_studi) {
                const prodiMatch = prodiRes.data.find(p => p.name === formData.program_studi);
                if (prodiMatch) {
                  setSelectedProdiId(prodiMatch.id);
                }
              }
            }
          } catch (err) {
            console.error('Error loading prodi for auto-select:', err);
          }
        };
        loadProdiForDept();
      }
    }
  }, [formData.departemen, departemenList]);

  // When prodi list or formData.program_studi changes, resync selected prodi dropdown ID
  useEffect(() => {
    if (formData.program_studi && prodiList.length > 0) {
      const match = prodiList.find(p => p.name === formData.program_studi);
      if (match && match.id !== selectedProdiId) {
        setSelectedProdiId(match.id);
      }
    }
  }, [formData.program_studi, prodiList]);

  // Close city suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load letter data if in revision mode
  useEffect(() => {
    // Prevent infinite loop if data is already loaded
    if (currentLetterId === letterIdParam && currentMode === modeParam) {
      return;
    }

    const loadLetterData = async () => {
      if (letterIdParam && modeParam && (modeParam === 'revision' || modeParam === 'self-revise')) {
        setIsLoading(true);
        try {
          const response = await letterApi.getLetterById(letterIdParam);
          if (response.success && response.data) {
            const letter = response.data;

            // Extract revision comment if any
            const revisionStep = letter.approvalSteps?.find(step => step.status === 'REVISION');
            if (revisionStep?.comments) {
              setRevisionComment(revisionStep.comments);
            }

            // Map letter data to form fields
            // Prioritize letter.values (data submitted by student) over letter.createdBy (default data)
            const letterFormData = {
              nama_lengkap: letter.values?.nama_lengkap || letter.createdBy?.name || '',
              nim: letter.values?.nim || letter.createdBy?.mahasiswa?.nim || '',
              email: letter.values?.email || letter.createdBy?.email || '',
              departemen: letter.values?.departemen || letter.createdBy?.mahasiswa?.departemen?.name || '',
              program_studi: letter.values?.program_studi || letter.createdBy?.mahasiswa?.programStudi?.name || '',
              tempat_lahir: letter.values?.tempat_lahir || '',
              tanggal_lahir: letter.values?.tanggal_lahir || '',
              no_hp: letter.values?.no_hp || '',
              alamat: letter.values?.alamat || '',
              keperluan_surat: letter.values?.keperluan || '',
              jenis_surat: letter.letterType?.name || 'AK 006',
              // Detail akademik dan data orang tua
              semester: letter.values?.semester || 0,
              tahun_akademik: letter.values?.tahunAkademik || letter.values?.tahun_akademik || '',
              nama_ortu_wali: letter.values?.nama_ortu_wali || '',
              nip_pensiun_ortu_wali: letter.values?.nip_pensiun_ortu_wali || '',
              golongan_ortu_wali: letter.values?.golongan_ortu_wali || '',
              instansi_ortu_wali: letter.values?.instansi_ortu_wali || '',
            };

            // Update form data
            setFormData({
              nama_lengkap: letterFormData.nama_lengkap,
              nim: letterFormData.nim,
              email: letterFormData.email,
              no_hp: letterFormData.no_hp,
              alamat: letterFormData.alamat,
              departemen: letterFormData.departemen,
              program_studi: letterFormData.program_studi,
              tempat_lahir: letterFormData.tempat_lahir,
              tanggal_lahir: letterFormData.tanggal_lahir,
            });

            // Set revision mode in context
            setRevisionMode(letterIdParam, modeParam, letterFormData);

            // Handle Attachments
            if (letter.attachments && letter.attachments.length > 0) {
              const parsedAttachments: AttachmentData = {
                mandatory: [],
                optional: []
              };

              // Helper regex to parse filename format: [category]_[label]_realname
              // Example: [mandatory]_[KTM]_filename.pdf
              const filenameRegex = /^\[(.*?)\]_\[(.*?)\]_(.*)$/;

              letter.attachments.forEach(att => {
                const match = att.filename.match(filenameRegex);
                let category = 'mandatory'; // Default fallback
                let label = 'Lampiran';

                if (match) {
                  category = match[1];
                  label = match[2];
                }

                const field: DynamicFormField = {
                  label: label,
                  datatype: 'file',
                  validation: category === 'mandatory' ? 'REQUIRED' : 'OPTIONAL',
                  value: att.originalName || att.filename,
                  metadata: {
                    id: att.id,
                    status: 'completed',
                    size: att.size || 0,
                    uploadedData: {
                      url: att.url,
                      filename: att.filename,
                      originalName: att.originalName,
                      mimeType: att.mimeType,
                      size: att.size || 0,
                    }
                  }
                };

                if (category === 'mandatory') {
                  parsedAttachments.mandatory.push(field);
                } else {
                  parsedAttachments.optional.push(field);
                }
              });

              // Save to IndexedDB so it's available in step 3 (Lampiran) and step 4 (Review)
              await saveAttachments(parsedAttachments);
              console.log('Restored attachments for revision:', parsedAttachments);
            }
          }
        } catch (error) {
          console.error('Error loading letter data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadLetterData();
  }, [letterIdParam, modeParam, setRevisionMode, currentLetterId, currentMode]);

  const isRevisionMode = modeParam === 'revision' || modeParam === 'self-revise' || currentMode !== 'create';

  // Clear previous attachments if starting a new application
  useEffect(() => {
    if (!isRevisionMode && reachedStep === 0) {
      const clearData = async () => {
        try {
          await clearAttachments();
          await clearUploadedAttachments();
          console.log('Cleared previous attachments for new application');
        } catch (error) {
          console.error('Failed to clear attachments:', error);
        }
      };
      clearData();
    }
  }, [isRevisionMode, reachedStep]);

  // Reset progress if starting a totally new application (prevents skipping from previous session)
  useEffect(() => {
    if (!isRevisionMode && !letterIdParam && reachedStep > 1) {
      resetReachedStep();
      console.log('Reset progress for new application');
    }
  }, [isRevisionMode, letterIdParam, reachedStep, resetReachedStep]);

  // === VALIDATION HELPERS ===

  // PKL-139: NIM must be exactly 14 digits (string, not integer)
  const isNimValid = (nim: string) => {
    return /^\d{14}$/.test(nim);
  };

  // PKL-140: No HP must start with 08, 10-14 digits
  const isPhoneValid = (phone: string) => {
    if (!phone) return false;
    // Must start with 08
    if (!phone.startsWith('08')) return false;
    // Must be 10-14 digits
    if (phone.length < 10 || phone.length > 14) return false;
    // Must be all digits
    if (!/^\d+$/.test(phone)) return false;
    return true;
  };

  // PKL-141: Alamat must be at least 10 characters
  const isAlamatValid = (alamat: string) => {
    return alamat.trim().length >= 10;
  };

  // PKL-142: Tempat lahir must match Indonesian city
  const isTempatLahirValid = (tempat: string) => {
    return isValidCity(tempat);
  };

  // PKL-144: Email must be valid format
  const isEmailValid = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // PKL-147: Tanggal lahir year must be 1930-2100
  const isDateValid = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const year = date.getFullYear();
    if (year < 1930 || year > 2100) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  };

  const getDateErrorMessage = (dateString: string) => {
    if (!dateString) return 'Tanggal lahir wajib diisi.';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Format tanggal tidak valid.';
    const year = date.getFullYear();
    if (year < 1930 || year > 2100) return 'Tahun lahir harus antara 1930–2100.';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) return 'Tanggal lahir tidak boleh lebih dari hari ini.';
    return '';
  };

  // PKL-140: get phone error message
  const getPhoneErrorMessage = (phone: string) => {
    if (!phone) return 'No. HP wajib diisi.';
    if (!/^\d+$/.test(phone)) return 'No. HP hanya boleh berisi angka.';
    if (!phone.startsWith('08')) return 'No. HP harus diawali dengan 08.';
    if (phone.length < 10 || phone.length > 14) return 'No. HP harus 10–14 digit.';
    return '';
  };

  // Handle departemen change
  const handleDepartemenChange = async (deptId: string) => {
    setSelectedDepartemenId(deptId);
    setSelectedProdiId('');
    const dept = departemenList.find(d => d.id === deptId);
    setFormData(prev => ({
      ...prev,
      departemen: dept?.name || '',
      program_studi: '', // Reset prodi when departemen changes
    }));
    if (deptId) {
      try {
        const res = await referenceApi.getProgramStudi(deptId);
        if (res.success && res.data) {
          setProdiList(res.data);
        }
      } catch (err) {
        console.error('Error loading prodi:', err);
      }
    } else {
      setProdiList([]);
    }
  };

  // Handle prodi change
  const handleProdiChange = (prodiId: string) => {
    setSelectedProdiId(prodiId);
    const prodi = prodiList.find(p => p.id === prodiId);
    setFormData(prev => ({
      ...prev,
      program_studi: prodi?.name || '',
    }));
  };

  // Handle tempat lahir input with suggestions
  const handleTempatLahirChange = (value: string) => {
    setFormData(prev => ({ ...prev, tempat_lahir: value }));
    if (value.trim().length >= 2) {
      const suggestions = searchCities(value, 8);
      setCitySuggestions(suggestions);
      setShowCitySuggestions(suggestions.length > 0);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  };

  const selectCity = (city: string) => {
    setFormData(prev => ({ ...prev, tempat_lahir: city }));
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  const handleNext = () => {
    try {
      if (
        formData.nama_lengkap &&
        formData.nim &&
        isNimValid(formData.nim) &&
        formData.email &&
        isEmailValid(formData.email) &&
        formData.departemen &&
        formData.program_studi &&
        formData.tempat_lahir &&
        isTempatLahirValid(formData.tempat_lahir) &&
        formData.tanggal_lahir &&
        isDateValid(formData.tanggal_lahir) &&
        formData.alamat &&
        isAlamatValid(formData.alamat) &&
        formData.no_hp &&
        isPhoneValid(formData.no_hp)
      ) {
        saveAndNext(formData, 1);
        // Preserve query params in revision mode
        const queryParams = letterIdParam && modeParam
          ? `?letterId=${letterIdParam}&mode=${modeParam}`
          : '';
        router.push(`/surat-keterangan-aktif-kuliah/detail-pengajuan${queryParams}`);
      } else {
        setShowError(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setShowError(true);
    }
  };

  const disableNext =
    !formData.nama_lengkap ||
    !formData.nim ||
    !isNimValid(formData.nim) ||
    !formData.email ||
    !isEmailValid(formData.email) ||
    !formData.departemen ||
    !formData.program_studi ||
    !formData.tempat_lahir ||
    !isTempatLahirValid(formData.tempat_lahir) ||
    !formData.tanggal_lahir ||
    !isDateValid(formData.tanggal_lahir) ||
    !formData.alamat ||
    !isAlamatValid(formData.alamat) ||
    !formData.no_hp ||
    !isPhoneValid(formData.no_hp);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Memuat data surat...</span>
        </div>
      </div>
    );
  }

  const selectClassName = 'flex w-full rounded-[8px] pt-2.5 pr-3 pb-2.5 pl-3 text-sm transition-all duration-200 outline-none bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-400/20';

  return (
    <div className='bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300'>
      <Breadcrumbs
        parents={[{ label: 'Home' }, { label: 'AK-006' }]}
        currentPage={isRevisionMode ? 'Revisi - Identitas Pemohon' : 'Identitas Pemohon'}
      />
      <PageWrapper>
        <PageHeader
          title={isRevisionMode ? 'Revisi Surat - Identitas Pemohon' : 'Identitas Pemohon'}
          description={isRevisionMode
            ? 'Perbaiki data surat Anda sesuai catatan dari verifikator. Mohon periksa dan lengkapi data yang diperlukan.'
            : 'Data berikut diisi secara otomatis berdasarkan data Anda. Mohon periksa kembali dan lengkapi data yang diperlukan.'
          }
        />

        {/* Revision Comment Alert */}
        {revisionComment && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6 transition-colors duration-300">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
                <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <h4 className="font-semibold text-orange-800 dark:text-orange-400 text-sm">Catatan Revisi dari Verifikator</h4>
                <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">{revisionComment}</p>
              </div>
            </div>
          </div>
        )}

        <SuratStepper Value={1} />
        <FormSection>
          {/* Reusable Ubah/Kunci button */}
          {(() => {
            const UbahButton = ({ field }: { field: LockableField }) => (
              !editableFields[field] ? (
                <button
                  type="button"
                  onClick={() => setWarningField(field)}
                  className="px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap"
                >
                  Ubah
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => lockField(field)}
                  className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  Kunci
                </button>
              )
            );
            return null;
          })()}

          {/* Nama Lengkap - locked by default */}
          <FormField label='Nama Lengkap'>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  type="text"
                  value={formData.nama_lengkap}
                  onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  readOnly={!editableFields.nama}
                />
              </div>
              {!editableFields.nama ? (
                <button type="button" onClick={() => setWarningField('nama')} className="px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap">Ubah</button>
              ) : (
                <div className="flex gap-1">
                  <button type="button" onClick={() => cancelField('nama')} className="px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap">Batal</button>
                  <button type="button" onClick={() => lockField('nama')} className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">Kunci</button>
                </div>
              )}
            </div>
            <FormError show={showError && !formData.nama_lengkap} message="Nama Lengkap wajib diisi." />
          </FormField>

          <FormField label='Role'>
            <Input type='text' value={profile.role || 'Mahasiswa'} readOnly />
          </FormField>

          {/* NIM - locked by default */}
          <FormField label='NIM'>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  value={formData.nim}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, nim: val });
                  }}
                  placeholder="Masukkan 14 digit NIM"
                  readOnly={!editableFields.nim}
                />
              </div>
              {!editableFields.nim ? (
                <button type="button" onClick={() => setWarningField('nim')} className="px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap">Ubah</button>
              ) : (
                <div className="flex gap-1">
                  <button type="button" onClick={() => cancelField('nim')} className="px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap">Batal</button>
                  <button type="button" onClick={() => lockField('nim')} className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">Kunci</button>
                </div>
              )}
            </div>
            <FormError show={showError && !formData.nim} message="NIM wajib diisi." />
            <FormError
              show={formData.nim.length > 0 && !isNimValid(formData.nim)}
              message={`NIM harus tepat 14 digit angka. (Saat ini: ${formData.nim.length} digit)`}
            />
          </FormField>

          {/* Email - locked by default */}
          <FormField label='Email'>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  readOnly={!editableFields.email}
                />
              </div>
              {!editableFields.email ? (
                <button type="button" onClick={() => setWarningField('email')} className="px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap">Ubah</button>
              ) : (
                <div className="flex gap-1">
                  <button type="button" onClick={() => cancelField('email')} className="px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap">Batal</button>
                  <button type="button" onClick={() => lockField('email')} className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">Kunci</button>
                </div>
              )}
            </div>
            <FormError show={showError && !formData.email} message="Email wajib diisi." />
            <FormError
              show={formData.email.length > 0 && !isEmailValid(formData.email)}
              message="Format email tidak valid. Pastikan email mengandung karakter @."
            />
          </FormField>

          {/* Departemen - locked by default */}
          <FormField label='Departemen'>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <select
                  className={selectClassName}
                  value={selectedDepartemenId}
                  onChange={(e) => handleDepartemenChange(e.target.value)}
                  disabled={!editableFields.departemen}
                >
                  <option value="">Pilih Departemen</option>
                  {departemenList.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              {!editableFields.departemen ? (
                <button type="button" onClick={() => setWarningField('departemen')} className="px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap">Ubah</button>
              ) : (
                <div className="flex gap-1">
                  <button type="button" onClick={() => cancelField('departemen')} className="px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap">Batal</button>
                  <button type="button" onClick={() => lockField('departemen')} className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">Kunci</button>
                </div>
              )}
            </div>
            <FormError show={showError && !formData.departemen} message="Departemen wajib dipilih." />
          </FormField>

          {/* Program Studi - locked by default */}
          <FormField label='Program Studi'>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <select
                  className={selectClassName}
                  value={selectedProdiId}
                  onChange={(e) => handleProdiChange(e.target.value)}
                  disabled={!editableFields.prodi || !selectedDepartemenId}
                >
                  <option value="">{selectedDepartemenId ? 'Pilih Program Studi' : 'Pilih Departemen terlebih dahulu'}</option>
                  {prodiList.map(prodi => (
                    <option key={prodi.id} value={prodi.id}>{prodi.name}</option>
                  ))}
                </select>
              </div>
              {!editableFields.prodi ? (
                <button type="button" onClick={() => setWarningField('prodi')} className="px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap">Ubah</button>
              ) : (
                <div className="flex gap-1">
                  <button type="button" onClick={() => cancelField('prodi')} className="px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap">Batal</button>
                  <button type="button" onClick={() => lockField('prodi')} className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">Kunci</button>
                </div>
              )}
            </div>
            <FormError show={showError && !formData.program_studi} message="Program Studi wajib dipilih." />
          </FormField>

          {/* Tempat Lahir - locked by default, with autocomplete */}
          <FormField label='Tempat Lahir'>
            <div className="flex gap-2 items-start">
              <div className="flex-1 relative" ref={cityInputRef}>
                <Input
                  type="text"
                  value={formData.tempat_lahir}
                  onChange={e => handleTempatLahirChange(e.target.value)}
                  onFocus={() => {
                    if (citySuggestions.length > 0) setShowCitySuggestions(true);
                  }}
                  placeholder="Ketik nama kota (contoh: Jakarta)"
                  readOnly={!editableFields.tempat_lahir}
                />
                {/* Autocomplete dropdown */}
                {editableFields.tempat_lahir && showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {citySuggestions.map((city, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectCity(city)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!editableFields.tempat_lahir ? (
                <button type="button" onClick={() => setWarningField('tempat_lahir')} className="px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap">Ubah</button>
              ) : (
                <div className="flex gap-1">
                  <button type="button" onClick={() => cancelField('tempat_lahir')} className="px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap">Batal</button>
                  <button type="button" onClick={() => lockField('tempat_lahir')} className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">Kunci</button>
                </div>
              )}
            </div>
            <FormError show={showError && !formData.tempat_lahir} message="Tempat Lahir wajib diisi." />
            <FormError
              show={formData.tempat_lahir.length > 0 && !isTempatLahirValid(formData.tempat_lahir)}
              message="Tempat Lahir harus sesuai dengan nama kota/kabupaten yang valid. Ketik dan pilih dari daftar yang tersedia (Indonesia & internasional)."
            />
          </FormField>

          {/* Tanggal Lahir - locked by default */}
          <FormField label='Tanggal Lahir'>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  type="date"
                  value={formData.tanggal_lahir}
                  onChange={e => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                  min="1930-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  readOnly={!editableFields.tanggal_lahir}
                />
              </div>
              {!editableFields.tanggal_lahir ? (
                <button type="button" onClick={() => setWarningField('tanggal_lahir')} className="px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap">Ubah</button>
              ) : (
                <div className="flex gap-1">
                  <button type="button" onClick={() => cancelField('tanggal_lahir')} className="px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap">Batal</button>
                  <button type="button" onClick={() => lockField('tanggal_lahir')} className="px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap">Kunci</button>
                </div>
              )}
            </div>
            <FormError
              show={(formData.tanggal_lahir && !isDateValid(formData.tanggal_lahir)) || (showError && !formData.tanggal_lahir)}
              message={getDateErrorMessage(formData.tanggal_lahir)}
            />
          </FormField>

          {/* Unified Warning Modal for all lockable fields */}
          {warningField && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Peringatan</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-6">
                  Hal ini akan mengganti <strong>{fieldLabels[warningField]}</strong> Anda pada database. Apakah Anda yakin ingin mengubah {fieldLabels[warningField].toLowerCase()}?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setWarningField(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => unlockField(warningField)}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Ya, Ubah {fieldLabels[warningField]}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PKL-140: No. HP - must start with 08 */}
          <FormField label='No. HP'>
            <Input
              type='text'
              inputMode='numeric'
              placeholder='081234567890'
              maxLength={14}
              value={formData.no_hp}
              onChange={(e) => {
                // Only allow digits
                const val = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, no_hp: val });
              }}
            />
            <FormError
              show={(formData.no_hp.length > 0 && !isPhoneValid(formData.no_hp)) || (showError && !formData.no_hp)}
              message={getPhoneErrorMessage(formData.no_hp)}
            />
          </FormField>

          {/* PKL-141: Alamat - minimum 10 characters */}
          <FormField label='Alamat'>
            <Input
              type='text'
              placeholder='Masukkan Alamat (minimal 10 karakter)'
              value={formData.alamat}
              onChange={(e) =>
                setFormData({ ...formData, alamat: e.target.value })
              }
            />
            <FormError
              show={showError && !formData.alamat}
              message='Alamat wajib diisi.'
            />
            <FormError
              show={formData.alamat.length > 0 && !isAlamatValid(formData.alamat)}
              message={`Alamat harus minimal 10 karakter. (Saat ini: ${formData.alamat.trim().length} karakter)`}
            />
          </FormField>
        </FormSection>
        <div className='flex justify-between items-center mt-6'>
          <button
            onClick={() => {
              if (isRevisionMode && letterIdParam) {
                // Cancel revision/viewing -> Go back to detail page
                router.push(`/mahasiswa/detail-surat?id=${letterIdParam}`);
              } else {
                router.push('/mahasiswa/dashboard-mahasiswa');
              }
            }}
            type='button'
            className='px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'
          >
            Kembali
          </button>
          <button
            onClick={handleNext}
            className='px-6 py-2.5 bg-[#0EA5E9] dark:bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50'
          >
            Selanjutnya
          </button>
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
