'use client';

import { useState } from 'react';
import { useRouter } from '@/hooks/use-app-router';
import TopBar from '@/components/layouts/TopBar';

import ProfilePage from '@/components/pages/ProfilePage';
import { AppSidebar } from '@/components/layouts/SideBar';

export default function Page() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();
    const [activeMenu, setActiveMenu] = useState('profil');

    return (
        <>
            <div className='min-h-screen flex flex-col dark:bg-gray-900 transition-colors duration-300'>
                <TopBar role='Mahasiswa' onMenuClick={() => setSidebarOpen(true)} />

                <div className='flex flex-1 bg-gray-50 dark:bg-gray-900 transition-colors duration-300'>
                    {/* Mobile sidebar overlay */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 top-14 sm:top-16 bg-black/50 z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* Sidebar spacer */}
                    <div className="w-0 lg:w-[280px] flex-shrink-0 overflow-hidden transition-all duration-300" />

                    {/* Sidebar */}
                    <aside className={`
          fixed inset-y-0 left-0
          w-[280px] bg-white dark:bg-gray-800 flex flex-col text-gray-700 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          z-50 lg:z-40
          top-14 sm:top-16
          h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)]
          overflow-y-auto
        `}>
                        <div className='p-4 space-y-2'>
                            {/* Mobile close button */}
                            <div className="lg:hidden flex items-center justify-between mb-4 pb-2 border-b dark:border-gray-700">
                                <span className="font-semibold dark:text-white">Menu</span>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Dasbor */}
                            <div
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === 'dasbor' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                onClick={() => {
                                    setActiveMenu('dasbor');
                                    router.push('/mahasiswa/dashboard-mahasiswa');
                                }}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                <span className='font-medium'>Dasbor</span>
                            </div>

                            {/* Surat Saya */}
                            <div
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === 'surat-saya' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                onClick={() => {
                                    setActiveMenu('surat-saya');
                                    router.push('/mahasiswa/surat-saya');
                                }}
                            >
                                <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                                    <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                                </svg>
                                <span className='font-medium'>Surat Saya</span>
                            </div>

                            {/* Profil */}
                            <div
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeMenu === 'profil' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                onClick={() => {
                                    setActiveMenu('profil');
                                }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className='font-medium'>Profil</span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <div className='mt-auto p-4 border-t border-gray-200 dark:border-gray-700'>
                            <button
                                onClick={() => {
                                    if (confirm('Apakah Anda yakin ingin keluar?')) {
                                        router.push('/auth');
                                    }
                                }}
                                className='flex items-center gap-3 p-3 w-full rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors'
                            >
                                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                                </svg>
                                <span className='font-medium'>Keluar</span>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className='flex-1 p-4 sm:p-6 lg:p-8 pb-24 w-full min-w-0'>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push("/mahasiswa/dashboard-mahasiswa")}>
                                    Dasbor
                                </span>
                                <span className="mx-2">/</span>
                                <span className="text-gray-800 dark:text-white font-medium">Profil</span>
                            </div>
                        </div>
                        <ProfilePage roleTitle="Mahasiswa" />
                    </main>
                </div>
            </div>

        </>
    );
}
