'use client';

import { useState, useEffect, useRef } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { withBasePath } from '@/lib/navigation';
import { type UserProfile } from '@/lib/api';

interface UserDropdownProps {
    profile: UserProfile | null;
    role: string;
    onLogout: () => void;
}

export default function UserDropdown({ profile, role, onLogout }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => setIsOpen(!isOpen);

    // Get user initial for avatar
    const userInitial = profile?.name?.charAt(0)?.toUpperCase() || role.charAt(0).toUpperCase();

    // Profile URL mapping based on role
    const getProfileUrl = (userRole: string) => {
        const roleLower = userRole.toLowerCase().replace(/\s+/g, '-');
        switch (userRole) {
            case 'Mahasiswa':
                return withBasePath('/mahasiswa/profile');
            case 'Manajer TU':
                return withBasePath('/manajer-tu/profile');
            case 'Superadmin':
                return withBasePath('/superadmin/users');
            case 'Supervisor Akademik':
                return withBasePath('/supervisor-akademik/profile');
            case 'UPA':
                return withBasePath('/upa/profile');
            default:
                return withBasePath(`/${roleLower}/profile`);
        }
    };

    const profileUrl = getProfileUrl(role);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={toggleDropdown}
                className="flex items-center gap-2 p-1.5 rounded-full lg:rounded-lg hover:bg-white/10 transition-all duration-200 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-[#0586c6] dark:text-blue-800 font-bold text-sm sm:text-base select-none shadow-sm flex-shrink-0 transition-transform duration-200">
                    {userInitial}
                </div>
                <div className="hidden lg:flex flex-col items-start mr-1 transition-all duration-200">
                    <span className="text-white text-sm font-semibold leading-tight max-w-[120px] truncate">
                        {profile?.name || role}
                    </span>
                    <span className="text-white/70 text-[10px] sm:text-[11px] font-medium leading-none">
                        {role}
                    </span>
                </div>
                <ChevronDown
                    className={`hidden lg:block w-4 h-4 text-white/70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                    {/* Header (Mobile-ish) */}
                    <div className="lg:hidden px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {profile?.name || role}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {role}
                        </p>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                        {/* Profile Link - Hidden for Superadmin */}
                        {role !== 'Superadmin' && (
                            <a
                                href={profileUrl}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-[#0586c6]/10 dark:hover:bg-blue-900/30 hover:text-[#0586c6] dark:hover:text-blue-400 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-[#0586c6] dark:group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="font-medium">Profil Saya</span>
                            </a>
                        )}

                        {role !== 'Superadmin' && <div className="my-1 border-t border-gray-100 dark:border-gray-700" />}

                        {/* Logout Button */}
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onLogout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <LogOut className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-left flex-1">Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
