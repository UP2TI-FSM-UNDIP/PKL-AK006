'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';
import { withBasePath } from '@/lib/navigation';
import NotificationDropdown from '@/components/ui/NotificationDropdown';
import { useTheme } from '@/context/ThemeProvider';
import { userApi, type UserProfile } from '@/lib/api';
import { signOut } from '@/lib/auth-client';
import UserDropdown from '@/components/ui/UserDropdown';

interface TopBarProps {
  role?: string;
  onMenuClick?: () => void;
  hideUserControls?: boolean; // Hide notification and profile icons
}

export default function TopBar({ role = 'Manajer TU', onMenuClick, hideUserControls = false }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile();
        if (res.success && res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    if (!hideUserControls) {
      fetchProfile();
    }
  }, [hideUserControls]);

  // Fix for "white gap" on overscroll: set body background to match header color
  useEffect(() => {
    // Add classes to body to match header color
    document.body.classList.add('bg-[#0586c6]', 'dark:bg-blue-800');

    return () => {
      // Remove classes when component unmounts
      document.body.classList.remove('bg-[#0586c6]', 'dark:bg-blue-800');
    };
  }, []);


  const handleLogout = async () => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
    try {
      await signOut();
      window.location.href = `${base}/auth`;
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = `${base}/auth`;
    }
  };

  // Get user initial for avatar
  const userInitial = profile?.name?.charAt(0)?.toUpperCase() || role.charAt(0).toUpperCase();

  // Dashboard URL mapping based on role
  const getDashboardUrl = (userRole: string) => {
    if (hideUserControls) return '/';

    switch (userRole) {
      case 'Mahasiswa':
        return withBasePath('/mahasiswa/dashboard-mahasiswa');
      case 'Manajer TU':
        return withBasePath('/manajer-tu/dashboard-persuratan');
      case 'Superadmin':
        return withBasePath('/superadmin/dashboard');
      case 'Supervisor Akademik':
        return withBasePath('/supervisor-akademik/dashboard');
      case 'UPA':
        return withBasePath('/upa/dashboard');
      default:
        return withBasePath('/');
    }
  };

  const dashboardUrl = getDashboardUrl(role);

  return (
    <header className='w-full flex items-center justify-between bg-[#0586c6] dark:bg-blue-800 px-3 sm:px-6 py-2 sm:py-4 h-14 sm:h-16 sticky top-0 z-[70] transition-colors duration-300'>
      {/* Mobile menu button + Logo */}
      <div className='flex items-center gap-2 sm:gap-3'>
        {/* Hamburger menu button - only visible on mobile/tablet */}
        {!hideUserControls && (
          <button
            onClick={onMenuClick}
            className='lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors'
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* Logo - responsive sizing */}
        <a
          href={dashboardUrl}
          className='flex items-center hover:opacity-80 transition-opacity duration-200'
        >
          <Image
            src='/template/logo-fsm.png'
            alt='Logo Undip'
            width={235}
            height={55}
            className='h-7 sm:h-10 md:h-12 w-auto'
            priority
          />
        </a>
      </div>

      {/* Right side - Notification, Role, Avatar (hidden on auth pages) */}
      {!hideUserControls && (
        <div className='flex items-center gap-2 sm:gap-4'>
          {/* Notification dropdown */}
          <NotificationDropdown role={role} />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className='p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300'
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className='w-5 h-5 text-white' />
            ) : (
              <Sun className='w-5 h-5 text-white' />
            )}
          </button>

          {/* Vertical Divider */}
          <div className="hidden sm:block w-px h-8 bg-white/20 mx-1" />

          {/* User Profile Dropdown */}
          <UserDropdown
            profile={profile}
            role={role}
            onLogout={handleLogout}
          />
        </div>
      )}
    </header>
  );
}
