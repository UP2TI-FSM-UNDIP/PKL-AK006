'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from '@/hooks/use-app-router'
import { useSearchParams } from 'next/navigation';
// UI Components
import FormSection from '@/components/ui/FormSection';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import HeaderPage from '@/components/ui/PageHeader';
import { FormError } from '@/components/FormSurat/FormError';

// Layout Components
import PageWrapper from '@/components/layouts/PageWrapper';

// Local Components
import { SuratStepper } from '@/app/surat-keterangan-aktif-kuliah/components';

import { useProfile } from '@/context/AK006';

function PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, saveAndNext, mode: currentMode } = useProfile();
  const [showErrors, setShowErrors] = useState(false);
  const [customGolongan, setCustomGolongan] = useState('');

  // Get query params for revision mode
  const letterIdParam = searchParams.get('letterId');
  const modeParam = searchParams.get('mode') as 'revision' | 'self-revise' | null;
  const isRevisionMode = modeParam === 'revision' || modeParam === 'self-revise' || currentMode !== 'create';

  // Query params to preserve in navigation
  const queryParams = letterIdParam && modeParam
    ? `?letterId=${letterIdParam}&mode=${modeParam}`
    : '';

  // Helper Data
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 15 }, (_, i) => {
    const start = currentYear - 7 + i;
    return `${start}/${start + 1}`;
  });

  const parentRanks = [
    {
      label: 'Golongan I (Juru)',
      options: [
        'Juru Muda / I/a',
        'Juru Muda Tingkat I / I/b',
        'Juru / I/c',
        'Juru Tingkat I / I/d',
      ]
    },
    {
      label: 'Golongan II (Pengatur)',
      options: [
        'Pengatur Muda / II/a',
        'Pengatur Muda Tingkat I / II/b',
        'Pengatur / II/c',
        'Pengatur Tingkat I / II/d',
      ]
    },
    {
      label: 'Golongan III (Penata)',
      options: [
        'Penata Muda / III/a',
        'Penata Muda Tingkat I / III/b',
        'Penata / III/c',
        'Penata Tingkat I / III/d',
      ]
    },
    {
      label: 'Golongan IV (Pembina)',
      options: [
        'Pembina / IV/a',
        'Pembina Tingkat I / IV/b',
        'Pembina Utama Muda / IV/c',
        'Pembina Utama Madya / IV/d',
        'Pembina Utama / IV/e',
      ]
    },
    {
      label: 'Lainnya',
      options: [
        '-',
        'TNI',
        'Polri',
        'Karyawan Swasta',
        'Wiraswasta',
        'Lainnya / Other',
      ]
    }
  ];

  const allStandardOptions = parentRanks.flatMap((g) => g.options);

  // Local State Batching
  const [formData, setFormData] = useState({
    jenis_surat: profile.jenis_surat || 'AK006',
    keperluan_surat: profile.keperluan_surat || '',
    nama_ortu_wali: profile.nama_ortu_wali || '',
    nip_pensiun_ortu_wali: profile.nip_pensiun_ortu_wali || '',
    golongan_ortu_wali: profile.golongan_ortu_wali || '',
    instansi_ortu_wali: profile.instansi_ortu_wali || '',
    semester: profile.semester || 0,
    tahun_akademik: profile.tahun_akademik || '',
  });

  useEffect(() => {
    if (isRevisionMode && profile.semester && profile.semester > 0) {
      let selectedGolongan = profile.golongan_ortu_wali || '';
      let initialCustom = '';

      if (
        selectedGolongan &&
        !allStandardOptions.includes(selectedGolongan) &&
        selectedGolongan !== 'Lainnya / Other'
      ) {
        initialCustom = selectedGolongan;
        selectedGolongan = 'Lainnya / Other';
      }

      setFormData({
        jenis_surat: profile.jenis_surat || 'AK006',
        keperluan_surat: profile.keperluan_surat || '',
        nama_ortu_wali: profile.nama_ortu_wali || '',
        nip_pensiun_ortu_wali: profile.nip_pensiun_ortu_wali || '',
        golongan_ortu_wali: selectedGolongan,
        instansi_ortu_wali: profile.instansi_ortu_wali || '',
        semester: profile.semester || 0,
        tahun_akademik: profile.tahun_akademik || '',
      });
      setCustomGolongan(initialCustom);
    }
  }, [profile, isRevisionMode, allStandardOptions]);

  const isFormValid =
    formData.keperluan_surat.length &&
    formData.nama_ortu_wali.length &&
    formData.nip_pensiun_ortu_wali.length &&
    formData.golongan_ortu_wali.length &&
    (formData.golongan_ortu_wali !== 'Lainnya / Other' || customGolongan.length > 0) &&
    formData.instansi_ortu_wali.length &&
    formData.semester > 0 &&
    formData.tahun_akademik.length;

  const handleNext = () => {
    if (isFormValid) {
      const submissionData = { ...formData };
      if (formData.golongan_ortu_wali === 'Lainnya / Other') {
        submissionData.golongan_ortu_wali = customGolongan;
      }
      saveAndNext(submissionData, 1);
      router.push(`/surat-keterangan-aktif-kuliah/lampiran${queryParams}`);
    } else {
      setShowErrors(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    saveAndNext(formData, -1);
    router.push(`/surat-keterangan-aktif-kuliah/identitas-pemohon${queryParams}`);
  };

  return (
    <div className='w-full min-h-screen bg-gray-50 dark:bg-gray-900 py-5.5 transition-colors duration-300'>
      <Breadcrumbs
        parents={[{ label: 'Home' }, { label: 'AK-006' }]}
        currentPage={isRevisionMode ? 'Revisi - Detail Pengajuan' : 'Detail Pengajuan'}
      />
      <PageWrapper>
        <HeaderPage
          title={isRevisionMode ? 'Revisi Surat - Detail Pengajuan' : 'Detail Pengajuan'}
          description={isRevisionMode
            ? 'Perbaiki detail pengajuan surat Anda sesuai catatan dari verifikator.'
            : 'Lengkapi detail utama dari surat yang akan diajukan.'
          }
        />
        <SuratStepper Value={2} />
        <FormSection className='md:grid-cols-1' title='Keperluan Surat'>
          <FormField label='Jenis Surat'>
            <Input type='text' required value={formData.jenis_surat} readOnly />
          </FormField>
          <FormField label='Keperluan Surat'>
            <Input
              type='text'
              required
              minLength={12}
              maxLength={500}
              placeholder='Tulis perihal singkat yang mewakili isi surat.'
              value={formData.keperluan_surat}
              onChange={(e) =>
                setFormData({ ...formData, keperluan_surat: e.target.value })
              }
            />
            <div className='flex justify-between mt-1'>
              <FormError
                show={showErrors && formData.keperluan_surat.length < 12}
                message={
                  formData.keperluan_surat.length === 0
                    ? 'Keperluan surat wajib diisi.'
                    : 'Minimal 12 karakter.'
                }
              />
              <div
                className={`text-xs ${formData.keperluan_surat.length < 12
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                {formData.keperluan_surat.length}/500
              </div>
            </div>
          </FormField>
        </FormSection>
        <FormSection className='md:grid-cols-2' title='Detail Akademik'>
          <FormField label='Semester'>
            <select
              required
              className='w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all'
              value={formData.semester}
              onChange={(e) =>
                setFormData({ ...formData, semester: parseInt(e.target.value) })
              }
            >
              <option value={0} disabled className='dark:bg-gray-700'>Pilih Semester</option>
              {Array.from({ length: 14 }, (_, i) => i + 1).map((sem) => (
                <option key={sem} value={sem} className='dark:bg-gray-700'>
                  Semester {sem}
                </option>
              ))}
            </select>
            <FormError
              show={showErrors && formData.semester === 0}
              message='Semester wajib dipilih.'
            />
          </FormField>
          <FormField label='Tahun Akademik Berjalan'>
            <select
              required
              className='w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all'
              value={formData.tahun_akademik}
              onChange={(e) =>
                setFormData({ ...formData, tahun_akademik: e.target.value })
              }
            >
              <option value="" disabled className='dark:bg-gray-700'>Pilih Tahun Akademik Berjalan</option>
              {academicYears.map((year) => (
                <option key={year} value={year} className='dark:bg-gray-700'>
                  {year}
                </option>
              ))}
            </select>
            <FormError
              show={showErrors && !formData.tahun_akademik}
              message='Tahun Akademik wajib dipilih.'
            />
          </FormField>
        </FormSection>
        <FormSection title='Data Orang Tua / Wali'>
          <FormField label='Nama Orang Tua / Wali'>
            <Input
              type='text'
              required
              placeholder='Masukkan nama orang tua atau wali.'
              value={formData.nama_ortu_wali}
              onChange={(e) =>
                setFormData({ ...formData, nama_ortu_wali: e.target.value })
              }
            />
            <FormError
              show={showErrors && !formData.nama_ortu_wali}
              message='Nama wajib diisi.'
            />
          </FormField>
          <FormField label='NIP / NIK Orang Tua / Wali'>
            <Input
              type='text'
              required
              placeholder='Masukkan NIP atau NIK orang tua atau wali.'
              value={formData.nip_pensiun_ortu_wali}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nip_pensiun_ortu_wali: e.target.value,
                })
              }
            />
            <FormError
              show={showErrors && !formData.nip_pensiun_ortu_wali}
              message='NIP/NIK wajib diisi.'
            />
          </FormField>
          <FormField label='Pangkat / Golongan'>
            <select
              required
              className='w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all'
              value={formData.golongan_ortu_wali}
              onChange={(e) =>
                setFormData({ ...formData, golongan_ortu_wali: e.target.value })
              }
            >
              <option value="" disabled className='dark:bg-gray-700'>Pilih Pangkat / Golongan</option>
              {parentRanks.map((group) => (
                <optgroup key={group.label} label={group.label} className='dark:bg-gray-700 font-semibold text-gray-900 dark:text-gray-200'>
                  {group.options.map((rank) => (
                    <option key={rank} value={rank} className='dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-normal'>
                      {rank}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <FormError
              show={showErrors && !formData.golongan_ortu_wali}
              message='Pangkat/Golongan wajib dipilih.'
            />
          </FormField>
          {formData.golongan_ortu_wali === 'Lainnya / Other' && (
            <FormField label='Keterangan Pangkat / Golongan'>
              <Input
                type='text'
                required
                placeholder='Contoh: Karyawan Swasta, Wiraswasta, TNI, dsb.'
                value={customGolongan}
                onChange={(e) => setCustomGolongan(e.target.value)}
              />
              <FormError
                show={showErrors && !customGolongan}
                message='Keterangan wajib diisi jika memilih Lainnya.'
              />
            </FormField>
          )}
          <FormField label='Instansi'>
            <Input
              type='text'
              required
              placeholder='Masukkan instansi orang tua atau wali.'
              value={formData.instansi_ortu_wali}
              onChange={(e) =>
                setFormData({ ...formData, instansi_ortu_wali: e.target.value })
              }
            />
            <FormError
              show={showErrors && !formData.instansi_ortu_wali}
              message='Instansi wajib diisi.'
            />
          </FormField>
        </FormSection>
        <div className='flex justify-between items-center mt-6'>
          <button
            onClick={handleBack}
            className='px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'
          >
            Kembali
          </button>
          <div className='flex gap-3'>
            {!isRevisionMode && (
              <button
                onClick={() => console.log('Simpan draft')}
                className='px-8 py-2.5 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 rounded-lg font-medium text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors'
              >
                Simpan Draft
              </button>
            )}
            <button
              onClick={handleNext}
              className='px-8 py-2.5 bg-[#0EA5E9] dark:bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed'
            >
              Lanjut
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
