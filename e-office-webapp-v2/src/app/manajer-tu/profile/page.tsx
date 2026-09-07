"use client";

import ProfilePage from '@/components/pages/ProfilePage';
import { AppSidebar } from '@/components/layouts/SideBar';
import TopBar from '@/components/layouts/TopBar';
import { useState } from 'react';
import { useRouter } from '@/hooks/use-app-router';

export default function Page() {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col">
            <TopBar role="Manajer TU" onMenuClick={() => setSidebarOpen(true)} />
            <div className="flex flex-1 min-w-0 bg-[#F3F3F3] dark:bg-gray-900 transition-colors">
                <AppSidebar role="manajer-tu" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-12 xl:px-24 pt-6 sm:pt-8 pb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={() => router.push("/manajer-tu/dashboard-persuratan")}>
                                Dasbor
                            </span>
                            <span className="mx-2">/</span>
                            <span className="text-gray-800 dark:text-white font-medium">Profil</span>
                        </div>
                    </div>
                    <ProfilePage roleTitle="Manajer TU" />
                </main>
            </div>
        </div>
    );
}
