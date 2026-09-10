import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addressService, type AddressInput } from "@/api/services/address.service";
import { queryKeys } from "@/api/query-keys";

export function useAddAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) => addressService.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
}
