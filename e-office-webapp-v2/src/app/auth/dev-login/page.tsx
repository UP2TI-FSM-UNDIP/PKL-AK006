'use client';

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Eye, EyeOff, User, Lock, LogIn, Loader2 } from 'lucide-react';
import TopBar from '@/components/layouts/TopBar';
import Image from 'next/image';
import { signIn } from '@/lib/auth-client';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const demoUsers = [
  { email: 'mahasiswa@demo.local', name: 'Mahasiswa', role: '/mahasiswa' },
  { email: 'sa@demo.local', name: 'Supervisor Akademik', role: '/supervisor-akademik' },
  { email: 'mtu@demo.local', name: 'Manajer TU', role: '/manajer-tu' },
  { email: 'upa@demo.local', name: 'UPA', role: '/upa' },
];

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
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('Failed to fetch user roles, defaulting to home');
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

export default function DevLoginPage() {
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
      const result = await signIn.email({
        email: formData.username,
        password: formData.password,
        callbackURL: '/auth/dev-login',
      });

      console.log('Login result:', result);

      if (result.error) {
        const errorMsg = getErrorMessage(result.error);
        console.warn('Login failed:', errorMsg);
        setError(`Login failed: ${errorMsg}`);
      } else {
        console.log('Login successful:', result);
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

  const handleDemoLogin = async (email: string, _redirectPath: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting demo login with:', email);
      const result = await signIn.email({
        email,
        password: 'password1234',
        callbackURL: '/auth/dev-login',
      });

      console.log('Demo login result:', result);

      if (result.error) {
        const errorMsg = getErrorMessage(result.error);
        console.warn('Demo login failed:', errorMsg);
        setError(`Demo login failed: ${errorMsg}`);
      } else {
        console.log('Demo login successful:', result);
        setRedirecting(true);

        // Fetch user roles and redirect to appropriate dashboard
        const redirectPath = await getRedirectPath();
        console.log('Redirecting to:', redirectPath);

        window.location.href = `${BASE_PATH}${redirectPath}`;
      }
    } catch (error) {
      console.error('Demo login exception:', error);
      const errorMsg = getErrorMessage(error);
      setError(`An error occurred during demo login: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = () => {
    console.log('SSO Login attempt');
    // TODO: Implement SSO login
    console.log('SSO Login functionality to be implemented');
  };

  // Show loading overlay when redirecting
  if (redirecting) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='h-12 w-12 text-[#0B6FB6] animate-spin' />
          <p className='text-lg text-gray-600 font-medium'>Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col bg-gray-100'>
      {/* Header */}
      <TopBar role='' hideUserControls={true} />

      {/* Main Content */}
      <main className='flex-1 flex items-center justify-center p-4 md:p-8'>
        <div className='bg-white rounded-lg shadow-xl max-w-5xl w-full overflow-hidden'>
          <div className='grid md:grid-cols-2 gap-0'>
            {/* Left Side - Branding */}
            <div className='bg-gradient-to-br from-slate-50 to-slate-100 p-8 md:p-12 flex flex-col justify-center'>
              <Image
                src='/icon/logo-undip.png'
                alt='Auth Logo'
                width={250}
                height={250}
                className='mb-4 mx-auto'
              />
              <h1 className='text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center'>
                FSM UNDIP SSO
              </h1>
              <p className='text-gray-600 text-sm md:text-base text-center'>
                Welcome to FSM UNDIP Application Portal.
                <br />
                Please sign in to access your dashboard.
              </p>
            </div>

            {/* Right Side - Login Form */}
            <div className='p-8 md:p-12'>
              <div className='mb-8'>
                <h2 className='text-2xl font-bold text-gray-800 mb-2'>
                  Sign In
                </h2>
                <p className='text-gray-500 text-sm'>
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
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Username or Email
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <User className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='username'
                      type='text'
                      placeholder='Enter your username or email'
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className='block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B6FB6] focus:border-transparent outline-none transition-all'
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-gray-700 mb-2'
                  >
                    Password
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Lock className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Enter your password'
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className='block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B6FB6] focus:border-transparent outline-none transition-all'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    >
                      {showPassword ? (
                        <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                      ) : (
                        <Eye className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className='flex justify-end'>
                  <button
                    type='button'
                    className='text-sm text-[#0B6FB6] hover:text-[#094d7d] font-medium'
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type='submit'
                  disabled={loading}
                  className='w-full bg-[#2C3E50] text-white py-2.5 rounded-lg font-medium hover:bg-[#1a252f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>

                {/* Divider */}
                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-300'></div>
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-4 bg-white text-gray-500'>or</span>
                  </div>
                </div>

                {/* SSO Login Button */}
                <button
                  type='button'
                  onClick={handleSSOLogin}
                  disabled={loading}
                  className='w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Login with UNDIP SSO
                </button>

                {/* Demo Users Section */}
                <div className='mt-6'>
                  <div className='relative mb-3'>
                    <div className='absolute inset-0 flex items-center'>
                      <div className='w-full border-t border-gray-300'></div>
                    </div>
                    <div className='relative flex justify-center text-sm'>
                      <span className='px-4 bg-white text-gray-500 font-medium'>Quick Demo Login</span>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                    {demoUsers.map((user) => (
                      <button
                        key={user.email}
                        type='button'
                        onClick={() => handleDemoLogin(user.email, user.role)}
                        disabled={loading}
                        className='flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
                      >
                        <LogIn className='h-4 w-4' />
                        {user.name}
                      </button>
                    ))}
                  </div>

                  <p className='text-xs text-gray-500 text-center mt-2'>
                    Demo credentials: password1234
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-white border-t border-gray-200 py-4'>
        <div className='container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600'>
          <div className='text-center sm:text-left'>© 2026 (UP2TI) FSM UNDIP. All Rights Reserved.</div>
          <button className='text-[#0B6FB6] hover:text-[#094d7d]'>
            Support
          </button>
        </div>
      </footer>
    </div>
  );
}
