import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService, type UserListFilters } from "@/api/services/user.service";
import { queryKeys } from "@/api/query-keys";
import type { Role, UserStatus } from "@/types/user.types";

export function useUsersQuery(filters: UserListFilters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => userService.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => userService.updateRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => userService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}
