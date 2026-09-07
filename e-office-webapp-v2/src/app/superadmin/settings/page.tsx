"use client";

import ProfilePage from '@/components/pages/ProfilePage';
import { SuperadminSidebar } from '@/components/layouts/SuperadminSidebar';
import TopBar from '@/components/layouts/TopBar';
import { useState } from 'react';
import { useRouter } from '@/hooks/use-app-router';

export default function SuperadminSettingsPage() {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar role="Superadmin" onMenuClick={() => setSidebarOpen(true)} />
            <div className="flex flex-1 min-w-0 bg-[#F3F3F3] dark:bg-gray-900 transition-colors">
                <SuperadminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-12 xl:px-24 pt-6 sm:pt-8 pb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push("/superadmin/dashboard")}>
                                Dasbor
                            </span>
                            <span className="mx-2">/</span>
                            <span className="text-gray-800 dark:text-white font-medium">Pengaturan</span>
                        </div>
                    </div>
                    <ProfilePage roleTitle="Superadmin" />
                </main>
            </div>
        </div>
    );
}
