/**
 * Plugin Settings Hook
 *
 * Custom React hook for accessing and updating plugin settings.
 * Returns the flattened config object so callers can read settings?.ai_enabled directly.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface RawPluginSettings {
  enabled: boolean;
  config: Record<string, any>;
}

/**
 * Read plugin settings for a given plugin name.
 * Returns { data: config, isLoading, error, updateSettings }.
 */
export const usePluginSettings = (pluginName: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['plugins', pluginName, 'settings'],
    queryFn: async (): Promise<Record<string, any>> => {
      const response = await fetch(`/api/plugins/${pluginName}/settings`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load plugin settings');
      const data = await response.json();
      // Flatten: return config directly so callers use data?.ai_enabled, not data?.config?.ai_enabled
      return (data.settings as RawPluginSettings)?.config ?? {};
    },
  });

  const mutation = useMutation({
    mutationFn: async (config: Record<string, any>) => {
      const response = await fetch(`/api/plugins/${pluginName}/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (!response.ok) throw new Error('Failed to save plugin settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins', pluginName, 'settings'] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateSettings: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
};
