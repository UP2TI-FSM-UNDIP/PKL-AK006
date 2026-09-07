'use client';

import { useTheme } from '@/context/ThemeProvider';
import { Moon, Sun, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setNavigating(true);
    setTimeout(() => {
      window.location.href = `${BASE_PATH}/auth`;
    }, 1200);
  };

  const handleSSOLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    const clientId = process.env.NEXT_PUBLIC_SSO_CLIENT_ID ?? 'd2682b0b-18b6-4b8b-9026-fae03b6d45e2';
    const callbackUrl = 'https://apps-fsm.undip.ac.id/persuratan-penyataan-masih-kuliah-api/auth/sso';
    window.location.href = `https://apps-fsm.undip.ac.id/sso/?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}`;
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-950">

      {/* ====== LOADING OVERLAY ====== */}
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950 transition-opacity duration-500 ${navigating ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className={`transition-all duration-700 ${navigating ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
          <img
            src={`${BASE_PATH}/icon/logo-undip.png`}
            alt="UNDIP Logo"
            className="w-16 h-16 mx-auto mb-6 animate-pulse"
          />
          {/* Spinner */}
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 border-3 border-white/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-white/60 text-sm">Mengarahkan ke halaman login...</p>
        </div>
      </div>

      {/* ====== NAVBAR ====== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={`${BASE_PATH}/icon/logo-undip.png`}
              alt="UNDIP Logo"
              className="w-10 h-10 drop-shadow-md"
            />
            <div>
              <h2 className="text-lg font-bold text-white">
                E-Office FSM
              </h2>
              <p className="text-xs text-white/70">
                Universitas Diponegoro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all duration-300 cursor-pointer"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLogin}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm border border-white/20 transition-all duration-300 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* ====== HERO SECTION (Full Screen) ====== */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${BASE_PATH}/gedungap.jpg')` }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {/* Animated floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float-delayed" />
        </div>

        {/* Hero Content */}
        <div
          className={`relative z-10 text-center px-6 max-w-3xl mx-auto transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <img
                src={`${BASE_PATH}/icon/logo-undip.png`}
                alt="UNDIP Logo"
                className="w-20 h-20 drop-shadow-lg"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            E-Office
          </h1>
          <p className="text-xl md:text-2xl font-medium text-white/90 mb-6">
            Fakultas Sains dan Matematika UNDIP
          </p>

          <p className="text-sm md:text-base text-white/60 mb-10 max-w-md mx-auto leading-relaxed">
            Sistem Pengajuan Persuratan Digital untuk Mahasiswa
          </p>

          {/* CTA Button */}
          <button
            onClick={handleSSOLogin}
            disabled={navigating}
            className="group relative inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-2xl
              shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50
              hover:from-blue-500 hover:to-indigo-500
              transform hover:scale-105 active:scale-95
              transition-all duration-300 ease-out
              disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
              cursor-pointer"
          >
            <LogIn className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Login dengan SSO UNDIP
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          {/* Sub-text */}
          <p className="mt-5 text-sm text-white/50">
            Gunakan akun SSO UNDIP Anda untuk masuk
          </p>
        </div>

        {/* Footer text */}
        <div className="absolute bottom-6 left-0 right-0 z-10 text-center">
          <p className="text-white/30 text-xs">© 2026 (UP2TI) FSM UNDIP. All Rights Reserved.</p>
        </div>
      </section>
    </div>
  );
}
