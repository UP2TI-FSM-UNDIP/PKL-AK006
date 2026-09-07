'use client';
import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from 'react';
import { AttachmentData } from '../lib/indexedDB';
import { userApi } from '../lib/api';

// 1. Definisikan Struktur Data Profil
export interface ProfileData {
  nama_lengkap: string;
  role: string;
  nim: string;
  email: string;
  departemen: string;
  program_studi: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  no_hp: string;
  alamat: string;
  jenis_surat: string;
  keperluan_surat: string;
  nama_ortu_wali: string;
  nip_pensiun_ortu_wali: string;
  golongan_ortu_wali: string;
  instansi_ortu_wali: string;
  semester?: number;
  tahun_akademik?: string;
  attachments: AttachmentData;
}

// Taruh di luar komponen Provider di AK006.tsx
const DEFAULT_PROFILE_DATA: ProfileData = {
  nama_lengkap: '',
  role: '',
  nim: '',
  email: '',
  departemen: '',
  program_studi: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  no_hp: '',
  alamat: '',
  jenis_surat: '',
  keperluan_surat: '',
  nama_ortu_wali: '',
  nip_pensiun_ortu_wali: '',
  golongan_ortu_wali: '',
  instansi_ortu_wali: '',
  semester: 0,
  tahun_akademik: '',
  attachments: { mandatory: [], optional: [] },
};

// 2. Definisikan Tipe untuk Context
interface ProfileContextType {
  profile: ProfileData;
  reachedStep: number;
  saveAndNext: (
    newData: Partial<ProfileData>,
    currentStepIndex: number
  ) => void;
  letterId: string | null;
  mode: 'create' | 'revision' | 'self-revise';
  setRevisionMode: (letterId: string, mode: 'revision' | 'self-revise', letterData: Partial<ProfileData>) => void;
  resetReachedStep: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: Partial<ProfileData>;
}) => {
  // 1. Inisialisasi reachedStep langsung dari localStorage
  const [profile, setProfile] = useState<ProfileData>({
    ...DEFAULT_PROFILE_DATA,
    ...initialData,
  });

  const [reachedStep, setReachedStep] = useState<number>(() => {
    // Kode ini hanya jalan 1x saat mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('reached_step');
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  });

  // Revision mode state
  const [letterId, setLetterId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'revision' | 'self-revise'>('create');

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    // Fungsi ini hanya akan berjalan di sisi Client (Browser)
    const syncLocalData = async () => {
      const saved = localStorage.getItem('user_profile');
      const savedStep = localStorage.getItem('reached_step');

      let localProfile = {};

      if (saved) {
        try {
          localProfile = JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved profile', e);
        }
      }

      // Fetch from DB regardless to ensure we have latest data
      // especially if NIM or other fields are missing
      try {
        const dbProfile = await userApi.getProfile();
        if (dbProfile.success && dbProfile.data) {
          const userData = dbProfile.data;
          const mappedDBData = {
            nama_lengkap: userData.name || '',
            role: userData.roles?.[0] || 'Mahasiswa',
            nim: userData.mahasiswa?.nim || '',
            email: userData.email || '',
            departemen: userData.mahasiswa?.departemen?.name || '',
            program_studi: userData.mahasiswa?.programStudi?.name || '',
            tempat_lahir: userData.mahasiswa?.tempatLahir || '',
            tanggal_lahir: userData.mahasiswa?.tanggalLahir
              ? new Date(userData.mahasiswa.tanggalLahir).toISOString().split('T')[0]
              : '',
            no_hp: userData.mahasiswa?.noHp || '',
            alamat: userData.mahasiswa?.alamat || '',
          };

          setProfile((prev) => {
            const merged = { ...prev, ...mappedDBData };

            // Re-apply local changes if any, but only if they are not empty
            // This preserves unsaved edits during the session
            if (saved) {
              const localData = JSON.parse(saved);
              for (const key in localData) {
                const val = localData[key];
                if (val !== "" && val !== null && val !== undefined) {
                  (merged as any)[key] = val;
                }
              }
            }
            return merged;
          });
        } else {
          // If DB fetch failed, at least try to sync from local storage
          if (saved) {
            setProfile((prev) => {
              const merged = { ...prev };
              const localData = JSON.parse(saved);
              for (const key in localData) {
                const val = localData[key];
                if (val !== "" && val !== null && val !== undefined) {
                  (merged as any)[key] = val;
                }
              }
              return merged;
            });
          }
        }
      } catch (error) {
        console.error('Error fetching profile from DB:', error);
      }

      if (savedStep) {
        setReachedStep(parseInt(savedStep));
      }

      // Tandai bahwa proses sinkronisasi browser selesai
      setIsHydrated(true);
    };

    syncLocalData();
  }, []);

  // Save to localStorage whenever profile or reachedStep changes
  useEffect(() => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
    localStorage.setItem('reached_step', reachedStep.toString());
  }, [profile, reachedStep]);

  const saveAndNext = React.useCallback((
    newData: Partial<ProfileData>,
    currentStepIndex: number
  ) => {
    setProfile((prev) => {
      const updated = { ...prev, ...newData };
      // We can't access 'reachedStep' inside this callback if we want to keep dependencies stable
      // But we can check it in the setter or use a ref if needed. 
      // However, simplified approach: allow the function to be recreated if reachedStep changes is fine,
      // BUT 'reachedStep' changes often. 
      // Actually, standard setState pattern is better.
      return updated;
    });

    setReachedStep((prevStep) => {
      const nextStep = currentStepIndex + 1;
      if (nextStep > prevStep) {
        localStorage.setItem('reached_step', nextStep.toString());
        return nextStep;
      }
      return prevStep;
    });
  }, []);

  // Set revision mode with letter data
  const setRevisionMode = React.useCallback((
    newLetterId: string,
    newMode: 'revision' | 'self-revise',
    letterData: Partial<ProfileData>
  ) => {
    setLetterId(newLetterId);
    setMode(newMode);
    // Set profile with letter data and allow access to all steps
    setProfile((prev) => ({ ...prev, ...letterData }));
    setReachedStep(4); // Allow access to all steps
    localStorage.setItem('reached_step', '4');
    // We update localStorage for profile in the effect, but we can't wait for effect if we want immediate persistence
    // logic is handled by the effect [profile] dependency mainly.
  }, []);

  const resetReachedStep = React.useCallback(() => {
    setReachedStep(1);
    localStorage.setItem('reached_step', '1');
  }, []);

  const contextValue = React.useMemo(() => ({
    profile,
    reachedStep,
    saveAndNext,
    letterId,
    mode,
    setRevisionMode,
    resetReachedStep
  }), [profile, reachedStep, saveAndNext, letterId, mode, setRevisionMode, resetReachedStep]);

  if (!isHydrated) {
    return null; // Atau bisa tampilkan <LoadingSpinner />
  }

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile harus digunakan di dalam ProfileProvider');
  }
  return context;
};
