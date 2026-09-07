import { useState, useEffect } from 'react';
import { letterApi, type AK006TemplateConfig } from '@/lib/api';

/**
 * Hook to fetch the AK006 letter template configuration.
 * Uses a public endpoint so any role (mahasiswa, supervisor, etc.) can read it.
 * Falls back to built-in defaults if the API call fails or returns no data.
 *
 * TEMPLATE VERSIONING:
 * - If `letterTemplateConfig` is provided (from a letter instance's snapshot),
 *   it takes priority over the latest template from the API. This ensures that
 *   letters created before a template update continue using the old template.
 * - If `letterTemplateConfig` is null/undefined, the latest template is fetched.
 *
 * IMPORTANT: Always check `loading` before rendering the template component
 * to avoid briefly showing hardcoded default values instead of the latest
 * superadmin-configured template.
 */
export function useAK006Template(letterTemplateConfig?: AK006TemplateConfig | null) {
  const [templateConfig, setTemplateConfig] = useState<AK006TemplateConfig | null>(
    letterTemplateConfig || null
  );
  const [loading, setLoading] = useState(!letterTemplateConfig);
  const [error, setError] = useState(false);

  // If letterTemplateConfig changes (e.g. letter data loaded), update immediately
  useEffect(() => {
    if (letterTemplateConfig) {
      setTemplateConfig(letterTemplateConfig);
      setLoading(false);
      setError(false);
    }
  }, [letterTemplateConfig]);

  useEffect(() => {
    // Skip fetching if we already have a snapshot from the letter instance
    if (letterTemplateConfig) return;

    let cancelled = false;

    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await letterApi.getAK006TemplatePublic();
        if (!cancelled && res.success && res.data?.config) {
          setTemplateConfig(res.data.config as AK006TemplateConfig);
        } else if (!cancelled) {
          // API returned but no config — will use component defaults
          setError(true);
        }
      } catch {
        // Silently fall back to built-in defaults in the component
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTemplate();
    return () => { cancelled = true; };
  }, [letterTemplateConfig]);

  return { templateConfig, loading, error };
}
