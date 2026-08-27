import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/api/services/dashboard.service";
import { queryKeys } from "@/api/query-keys";

export function useDashboardOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: () => dashboardService.getOverview(),
    staleTime: 60_000,
  });
}
