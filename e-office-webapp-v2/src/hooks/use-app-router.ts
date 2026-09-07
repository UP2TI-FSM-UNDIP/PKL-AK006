import { useMemo } from 'react';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Drop-in replacement for next/navigation useRouter.
 * All navigation uses window.location.href so Apache reverse proxy
 * sub-path routing works correctly (no basePath in next.config.ts).
 */
export function useRouter() {
  return useMemo(() => ({
    push: (path: string) => {
      const fullPath = path.startsWith('http') ? path : `${BASE_PATH}${path}`;
      window.location.href = fullPath;
    },
    replace: (path: string) => {
      const fullPath = path.startsWith('http') ? path : `${BASE_PATH}${path}`;
      window.location.replace(fullPath);
    },
    refresh: () => {
      window.location.reload();
    },
    back: () => {
      window.history.back();
    },
    forward: () => {
      window.history.forward();
    },
    prefetch: (_path: string) => {},
  }), []);
}
