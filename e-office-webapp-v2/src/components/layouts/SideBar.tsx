"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

type SidebarRole = "manajer-tu" | "supervisor-akademik" | "upa" | "mahasiswa";

interface SidebarProps {
  role?: SidebarRole;
  isOpen?: boolean;
  onClose?: () => void;
}

const roleConfig = {
  "manajer-tu": {
    dashboardPath: "/manajer-tu/dashboard-persuratan",
    profilePath: "/manajer-tu/profile",
  },
  "supervisor-akademik": {
    dashboardPath: "/supervisor-akademik/dashboard",
    profilePath: "/supervisor-akademik/profile",
  },
  upa: {
    dashboardPath: "/upa/dashboard",
    profilePath: "/upa/profile",
  },
  mahasiswa: {
    dashboardPath: "/mahasiswa/dashboard-mahasiswa",
    profilePath: "/mahasiswa/profile",
  },
};

export function AppSidebar({ role = "manajer-tu", isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const config = roleConfig[role];

  // Check if a path is currently active
  const isActive = (path: string) => {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path + '/');
  };

  // Close sidebar when navigating on mobile
  const handleNavigation = (path: string) => {
    window.location.href = `${BASE_PATH}${path}`;
    if (onClose) onClose();
  };

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-14 sm:top-16 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar spacer - prevents main content from going behind fixed sidebar */}
      <div className="w-0 lg:w-[280px] flex-shrink-0 transition-all duration-300" />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0
          w-[280px]
          bg-white dark:bg-gray-800 flex flex-col text-gray-700 dark:text-gray-300 
          border-r border-gray-200 dark:border-gray-700 
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          z-[60] lg:z-40
          top-14 sm:top-16
          h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)]
          overflow-y-auto
        `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-lg text-gray-900 dark:text-white">Menu</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Konten utama sidebar */}
        <div className="p-4 space-y-2">
          {/* Dasbor */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive(config.dashboardPath)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            onClick={() => handleNavigation(config.dashboardPath)}
          >
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/icon/manajer-tu-icon/dash.svg`} alt="Dasbor" className="w-5 h-5" />
            <span className="font-medium">Dasbor</span>
          </div>



          {/* Profil */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isActive(config.profilePath)
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            onClick={() => handleNavigation(config.profilePath)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">Profil</span>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <button
            onClick={() => {
              if (confirm("Apakah Anda yakin ingin keluar?")) {
                handleNavigation("/auth");
              }
            }}
            className="flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}