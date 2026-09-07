'use client';

import { useEffect, useState } from 'react';
import { userApi, UserProfile } from '@/lib/api';
import { signOut } from '@/lib/auth-client';
import { Mail, User, Building2, GraduationCap, Calendar, CreditCard, Shield, MapPin, BadgeCheck, Briefcase, Lock, Key, X, Eye, EyeOff } from 'lucide-react';

interface ProfilePageProps {
    roleTitle?: string;
}

export default function ProfilePage({ roleTitle }: ProfilePageProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    // Password change state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const handlePasswordChange = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Konfirmasi password baru tidak cocok');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('Password baru minimal 6 karakter');
            return;
        }

        setIsSubmittingPassword(true);

        try {
            const res = await userApi.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });


            if (res.success) {
                setIsConfirmModalOpen(false);
                setPasswordSuccess('Password berhasil diubah. Mengalihkan ke halaman login...');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });

                // Sign out and redirect
                setTimeout(async () => {
                    const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
                    await signOut();
                    window.location.href = `${base}/auth`;
                }, 2000);
            } else {
                setPasswordError(res.message || 'Gagal mengubah password');
            }
        } catch (err) {
            setPasswordError('Terjadi kesalahan saat mengubah password');
        } finally {
            setIsSubmittingPassword(false);
        }
    };


    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await userApi.getProfile();
                if (response.success && response.data) {
                    setProfile(response.data);
                } else {
                    setError(response.message || 'Gagal mengambil data profil');
                }
            } catch (err) {
                setError('Terjadi kesalahan saat memuat profil');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6 animate-pulse space-y-6">
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl w-full"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Gagal Memuat Profil</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                    Muat Ulang
                </button>
            </div>
        );
    }

    if (!profile) return null;

    const isMahasiswa = !!profile.mahasiswa;
    const isPegawai = !!profile.pegawai;

    // Get user initial for avatar (same as TopBar)
    const userInitial = profile.name?.charAt(0)?.toUpperCase() || 'U';

    // Check if user has a role that should hide Dept/Prodi
    const hideDeptProdi = profile.roles?.some(role => {
        const r = role.toLowerCase().replace(/_/g, ' ');
        return (
            r.includes('supervisor') ||
            r.includes('manajer') ||
            r.includes('manager') ||
            r === 'upa' ||
            r === 'tu'
        );
    });

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

            {/* 1. Identity Summary Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-100 dark:border-gray-700 overflow-hidden relative flex items-center justify-center bg-gray-700 dark:bg-gray-600">
                            <span className="text-white font-bold text-4xl sm:text-5xl select-none">
                                {userInitial}
                            </span>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white dark:border-gray-800" title="Online"></div>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2 pt-2">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {isMahasiswa ? profile.mahasiswa?.programStudi?.name : ((!hideDeptProdi && profile.pegawai?.programStudi?.name) || 'User Sistem')}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-medium">
                                <Mail className="w-4 h-4" />
                                {profile.email}
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-sm font-medium">
                                <Shield className="w-4 h-4" />
                                {roleTitle || 'Member'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Detail Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Academic / Primary Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                Informasi Akademik
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                {isMahasiswa && (
                                    <>
                                        <DetailItem label="NIM" value={profile.mahasiswa?.nim} icon={<CreditCard className="w-4 h-4" />} />
                                        <DetailItem label="Angkatan" value={profile.mahasiswa?.angkatan} icon={<Calendar className="w-4 h-4" />} />
                                        <DetailItem label="Departemen" value={profile.mahasiswa?.departemen?.name} icon={<Building2 className="w-4 h-4" />} fullWidth />
                                        <DetailItem label="Program Studi" value={profile.mahasiswa?.programStudi?.name} icon={<GraduationCap className="w-4 h-4" />} fullWidth />
                                        <DetailItem label="Status Mahasiswa" value={profile.mahasiswa?.status} isBadge />
                                    </>
                                )}
                                {isPegawai && (
                                    <>
                                        <DetailItem label="NIP" value={profile.pegawai?.nip} icon={<CreditCard className="w-4 h-4" />} />
                                        <DetailItem label="Unit Kerja" value="Fakultas Sains dan Matematika" icon={<Briefcase className="w-4 h-4" />} />
                                        {!hideDeptProdi && (
                                            <>
                                                <DetailItem label="Departemen" value={profile.pegawai?.departemen?.name} icon={<Building2 className="w-4 h-4" />} fullWidth />
                                                <DetailItem label="Program Studi" value={profile.pegawai?.programStudi?.name} icon={<GraduationCap className="w-4 h-4" />} fullWidth />
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Account / Status */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Detail Akun
                            </h3>
                        </div>
                        <div className="p-6 space-y-5">


                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Terdaftar Di</p>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">E-Office FSM UNDIP</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Status Verifikasi</p>
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-100 dark:border-green-900/30">
                                    <BadgeCheck className="w-5 h-5" />
                                    <span className="text-sm font-medium">Terverifikasi</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#003366] to-[#004488] rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                <Shield className="w-6 h-6 text-blue-100" />
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Keamanan Data</h4>
                                <p className="text-xs text-blue-100 leading-relaxed opacity-90">
                                    Data profil Anda terenkripsi dan hanya dapat diakses oleh pihak yang berwenang di Universitas Diponegoro.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Lock className="w-5 h-5 text-blue-600" />
                                Keamanan Akun
                            </h3>
                        </div>
                        <div className="p-6">
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium text-sm"
                            >
                                <Key className="w-4 h-4" />
                                Ganti Password
                            </button>
                        </div>
                    </div>
                </div>

            </div>
            {/* Password Change Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Lock className="w-4 h-4 text-blue-600" />
                                Ganti Password
                            </h3>
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setIsConfirmModalOpen(true);
                        }} className="p-6 space-y-4">
                            {passwordError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                    <Shield className="w-4 h-4 flex-shrink-0" />
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
                                    <BadgeCheck className="w-4 h-4 flex-shrink-0" />
                                    {passwordSuccess}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Password Saat Ini
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword.current ? "text" : "password"}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Password Baru
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword.new ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all pr-10"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Konfirmasi Password Baru
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword.confirm ? "text" : "password"}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all pr-10"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingPassword}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmittingPassword ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Key className="w-4 h-4" />
                                            Ubah Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Konfirmasi Ganti Password
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Apakah Anda yakin ingin mengubah password akun Anda?
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handlePasswordChange()}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                                >
                                    Ya, Ganti
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, icon, fullWidth = false, isBadge = false }: { label: string, value?: string, icon?: React.ReactNode, fullWidth?: boolean, isBadge?: boolean }) {
    if (!value) return null;
    return (
        <div className={`sm:col-span-${fullWidth ? '2' : '1'} group`}>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                {icon && <span className="text-gray-400 group-hover:text-blue-500 transition-colors">{icon}</span>}
                {label}
            </dt>
            <dd>
                {isBadge ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800">
                        {value}
                    </span>
                ) : (
                    <div className="text-base font-medium text-gray-900 dark:text-white p-2.5 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800 group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-colors">
                        {value}
                    </div>
                )}
            </dd>
        </div>
    );
}
