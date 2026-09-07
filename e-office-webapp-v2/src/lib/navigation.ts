/**
 * Helper navigasi untuk sub-path deployment di Apache reverse proxy.
 *
 * Apache dikonfigurasi strip prefix sebelum diteruskan ke Next.js, sehingga
 * kita TIDAK menggunakan `basePath` di next.config.ts (itu menyebabkan 404).
 * Sebagai gantinya, semua navigasi manual (router.push, window.location.href)
 * harus diprefiks menggunakan fungsi ini.
 *
 * Penggunaan:
 *   router.push(withBasePath('/dashboard'))
 *   window.location.href = withBasePath('/sso/callback')
 */
export function withBasePath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Hindari double prefix
  if (basePath && cleanPath.startsWith(basePath + '/')) return cleanPath;
  if (basePath && cleanPath === basePath) return cleanPath;
  return `${basePath}${cleanPath}`;
}
