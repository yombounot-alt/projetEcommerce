import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/api/services/settings.service";
import { queryKeys } from "@/api/query-keys";

export function useSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => settingsService.get(),
  });
}
