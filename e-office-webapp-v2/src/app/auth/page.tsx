'use client';

import { useState } from 'react';
import { Eye, EyeOff, User, Lock, Loader2, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeProvider';
import { setAuthToken, getAuthToken, API_BASE_URL } from '@/lib/api';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';


// Role to redirect path mapping
const roleRedirectMap: Record<string, string> = {
  'mahasiswa': '/mahasiswa/dashboard-mahasiswa',
  'supervisor_akademik': '/supervisor-akademik/dashboard',
  'manager_tu': '/manajer-tu/dashboard-persuratan',
  'manajer_tu': '/manajer-tu/dashboard-persuratan',
  'upa': '/upa/dashboard',
  'superadmin': '/superadmin/dashboard',
};

// Helper function to extract a user-friendly error message
function getErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  if (typeof error === 'string') return error;

  if (typeof error === 'object') {
    // Handle Better Auth error object
    const errorObj = error as Record<string, unknown>;

    if (errorObj.message && typeof errorObj.message === 'string') {
      return errorObj.message;
    }

    if (errorObj.code && typeof errorObj.code === 'string') {
      // Map common error codes to user-friendly messages
      switch (errorObj.code) {
        case 'INVALID_EMAIL_OR_PASSWORD':
          return 'Invalid email or password';
        case 'USER_NOT_FOUND':
          return 'No account found with this email';
        case 'INVALID_PASSWORD':
          return 'Incorrect password';
        case 'EMAIL_NOT_VERIFIED':
          return 'Please verify your email before logging in';
        default:
          return errorObj.code;
      }
    }

    if (errorObj.statusText && typeof errorObj.statusText === 'string') {
      return errorObj.statusText;
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'An unknown error occurred';
  }
}

// Helper function to get redirect path based on user roles
async function getRedirectPath(): Promise<string> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      console.warn('Failed to fetch user roles, status:', response.status);
      return '/';
    }

    const responseData = await response.json();
    console.log('User data for redirect:', responseData);

    // Handle both direct user object (legacy) and standardized ApiResponse formats
    const userData = responseData.data || responseData;
    const roles = userData.roles as string[] | undefined;

    if (!roles || roles.length === 0) {
      console.warn('User has no roles, defaulting to home');
      return '/';
    }

    // Find the first matching role and get its redirect path
    for (const role of roles) {
      const normalizedRole = role.toLowerCase();
      if (roleRedirectMap[normalizedRole]) {
        return roleRedirectMap[normalizedRole];
      }
    }

    // Default to the first role's dashboard if no match found
    console.warn('No matching redirect for roles:', roles);
    return '/';
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return '/';
  }
}

export default function AuthPage() {
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', formData.username);

      // Call sign-in endpoint directly to capture the set-auth-token header
      const response = await fetch(`${API_BASE_URL}/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok || data.error) {
        const errorMsg = getErrorMessage(data.error || data.message || data);
        console.warn('Login failed:', errorMsg);
        setError(`Login failed: ${errorMsg}`);
      } else {
        // Capture the auth token from the response header
        const authToken = response.headers.get('set-auth-token');
        console.log('Auth token received:', authToken ? 'yes' : 'no');

        if (authToken) {
          setAuthToken(authToken);
          console.log('Auth token stored in localStorage');
        } else {
          console.warn('No auth token in response headers');
        }

        setRedirecting(true);

        // Fetch user roles and redirect to appropriate dashboard
        const redirectPath = await getRedirectPath();
        console.log('Redirecting to:', redirectPath);

        window.location.href = `${BASE_PATH}${redirectPath}`;
      }
    } catch (error) {
      console.error('Login exception:', error);
      const errorMsg = getErrorMessage(error);
      setError(`An error occurred during login: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Show loading overlay when redirecting
  if (redirecting) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-300'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='h-12 w-12 text-[#0B6FB6] dark:text-blue-400 animate-spin' />
          <p className='text-lg text-gray-600 dark:text-gray-300 font-medium'>Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors duration-300'>
      {/* Header with Theme Toggle */}
      <header className='w-full flex items-center justify-between bg-[#0586c6] dark:bg-blue-800 px-3 sm:px-6 py-2 sm:py-4 h-14 sm:h-16 sticky top-0 z-50 transition-colors duration-300'>
        <Image
          src='/template/logo-fsm.png'
          alt='Logo Undip'
          width={235}
          height={55}
          className='h-8 sm:h-10 md:h-12 w-auto'
          priority
        />
        <button
          onClick={toggleTheme}
          className='p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300'
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className='w-5 h-5 text-white' />
          ) : (
            <Sun className='w-5 h-5 text-white' />
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className='flex-1 flex items-center justify-center p-4 md:p-8'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full overflow-hidden transition-colors duration-300'>
          <div className='grid md:grid-cols-2 gap-0'>
            {/* Left Side - Branding */}
            <div className='bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 p-8 md:p-12 flex flex-col justify-center transition-colors duration-300'>
              <Image
                src='/icon/logo-undip.png'
                alt='Auth Logo'
                width={250}
                height={250}
                className='mb-4 mx-auto'
              />
              <h1 className='text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4 text-center'>
                FSM UNDIP SSO
              </h1>
              <p className='text-gray-600 dark:text-gray-300 text-sm md:text-base text-center'>
                Welcome to FSM UNDIP Application Portal.
                <br />
                Please sign in to access your dashboard.
              </p>
            </div>

            {/* Right Side - Login Form */}
            <div className='p-8 md:p-12'>
              <div className='mb-8'>
                <h2 className='text-2xl font-bold text-gray-800 dark:text-white mb-2'>
                  Sign In
                </h2>
                <p className='text-gray-500 dark:text-gray-400 text-sm'>
                  Enter your credentials to access your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-5'>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {/* Username Field */}
                <div>
                  <label
                    htmlFor='username'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Username or Email
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <User className='h-5 w-5 text-gray-400 dark:text-gray-500' />
                    </div>
                    <input
                      id='username'
                      type='text'
                      placeholder='Enter your username or email'
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className='block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#0B6FB6] dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                  >
                    Password
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Lock className='h-5 w-5 text-gray-400 dark:text-gray-500' />
                    </div>
                    <input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Enter your password'
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className='block w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#0B6FB6] dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    >
                      {showPassword ? (
                        <EyeOff className='h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400' />
                      ) : (
                        <Eye className='h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400' />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className='flex justify-end'>
                  <button
                    type='button'
                    className='text-sm text-[#0B6FB6] dark:text-blue-400 hover:text-[#094d7d] dark:hover:text-blue-300 font-medium'
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type='submit'
                  disabled={loading}
                  className='w-full bg-[#2C3E50] dark:bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-[#1a252f] dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>

                {/* Divider */}

              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 transition-colors duration-300'>
        <div className='container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
          <div className='text-center sm:text-left'>© 2026 (UP2TI) FSM UNDIP. All Rights Reserved.</div>
          <button className='text-[#0B6FB6] dark:text-blue-400 hover:text-[#094d7d] dark:hover:text-blue-300'>
            Support
          </button>
        </div>
      </footer>
    </div>
  );
}
