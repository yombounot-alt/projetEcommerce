import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/api/services/notification.service";
import { queryKeys } from "@/api/query-keys";

export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationService.list(),
  });
}
