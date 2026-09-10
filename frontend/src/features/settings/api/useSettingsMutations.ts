import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService, type PlatformSettings } from "@/api/services/settings.service";
import { queryKeys } from "@/api/query-keys";

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: Partial<PlatformSettings>) => settingsService.update(changes),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings.all, settings);
    },
  });
}
