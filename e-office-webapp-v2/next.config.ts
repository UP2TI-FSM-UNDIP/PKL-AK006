import type { NextConfig } from "next";

// Use localhost for internal proxy to avoid networking issues
const internalApiUrl = 'http://localhost:20022';

const nextConfig: NextConfig = {
  // assetPrefix untuk sub-path di Apache reverse proxy.
  // Apache strip prefix sebelum diteruskan ke Next.js, sehingga
  // Next.js menerima request tanpa prefix (basePath tidak dipakai).
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // images.path harus diset agar <Image> menggunakan prefix yang benar.
  // assetPrefix tidak otomatis mempengaruhi _next/image URL.
  images: {
    path: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/_next/image`,
  },

  async rewrites() {
    return [
      // Auth routes use /api prefix on backend
      {
        source: '/api/auth/:path*',
        destination: `${internalApiUrl}/api/auth/:path*`,
      },
      // Letter and other routes don't use /api prefix on backend
      {
        source: '/api/:path*',
        destination: `${internalApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
