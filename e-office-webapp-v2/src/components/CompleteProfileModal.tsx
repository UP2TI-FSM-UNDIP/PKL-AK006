'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '@/lib/api';
import { Loader2, X } from 'lucide-react';
import { getAuthToken, referenceApi } from '@/lib/api';

interface Departemen {
  id: string;
  name: string;
  code: string;
}

interface ProgramStudi {
  id: string;
  name: string;
  code: string;
  departemenId: string;
}

interface UserData {
  id: string;
  roles?: string[];
  mahasiswa?: object | null;
  pegawai?: object | null;
}

interface Props {
  user: UserData;
  onCompleted: () => void;
}

const PEGAWAI_ROLES = ['supervisor_akademik', 'manajer_tu', 'upa', 'superadmin'];

export default function CompleteProfileModal({ user, onCompleted }: Props) {
  const roles = (user.roles ?? []).map((r) => r.toLowerCase());
  const isMahasiswa = roles.includes('mahasiswa') && !user.mahasiswa;
  const isPegawai = roles.some((r) => PEGAWAI_ROLES.includes(r)) && !user.pegawai;

  const [visible, setVisible] = useState(isMahasiswa || isPegawai);

  const [departemenList, setDepartemenList] = useState<Departemen[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nim: '',
    tahunMasuk: '',
    nip: '',
    jabatan: '',
    noHp: '',
    alamat: '',
    tempatLahir: '',
    tanggalLahir: '',
    departemenId: '',
    programStudiId: '',
  });

  // Load departemen list
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    referenceApi.getDepartemen()
      .then((res) => {
        if (res.success && res.data) setDepartemenList(res.data);
      })
      .finally(() => setLoading(false));
  }, [visible]);

  // Load prodi ketika departemen berubah
  useEffect(() => {
    if (!form.departemenId) {
      setProdiList([]);
      setForm((f) => ({ ...f, programStudiId: '' }));
      return;
    }
    referenceApi.getProgramStudi(form.departemenId).then((res) => {
      if (res.success && res.data) setProdiList(res.data);
    });
  }, [form.departemenId]);

  if (!visible) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/me/complete-profile`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.message || `Server error: ${res.status}`);
        } else {
          const text = await res.text();
          console.error("Non-JSON error response:", text);
          throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal menyimpan profil');
      }

      setVisible(false);
      onCompleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Lengkapi Profil Anda
          </h2>
        </div>

        <p className="px-6 pt-4 text-sm text-gray-500 dark:text-gray-400">
          Akun Anda berhasil dibuat melalui SSO UNDIP. Lengkapi data berikut untuk melanjutkan.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Mahasiswa fields */}
            {isMahasiswa && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NIM <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="nim"
                    value={form.nim}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: 24010123456789"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tahun Masuk <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="tahunMasuk"
                    value={form.tahunMasuk}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: 2024"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {/* Pegawai fields */}
            {isPegawai && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NIP <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="nip"
                    value={form.nip}
                    onChange={handleChange}
                    required
                    placeholder="Nomor Induk Pegawai"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jabatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="jabatan"
                    value={form.jabatan}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: Dosen / Staff TU"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {/* Shared fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nomor HP <span className="text-red-500">*</span>
              </label>
              <input
                name="noHp"
                value={form.noHp}
                onChange={handleChange}
                required
                placeholder="Contoh: 08123456789"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tempat Lahir
              </label>
              <input
                name="tempatLahir"
                value={form.tempatLahir}
                onChange={handleChange}
                placeholder="Contoh: Semarang"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tanggal Lahir
              </label>
              <input
                name="tanggalLahir"
                type="date"
                value={form.tanggalLahir}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Departemen <span className="text-red-500">*</span>
              </label>
              <select
                name="departemenId"
                value={form.departemenId}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Departemen --</option>
                {departemenList.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Program Studi <span className="text-red-500">*</span>
              </label>
              <select
                name="programStudiId"
                value={form.programStudiId}
                onChange={handleChange}
                required
                disabled={!form.departemenId}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">-- Pilih Program Studi --</option>
                {prodiList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
