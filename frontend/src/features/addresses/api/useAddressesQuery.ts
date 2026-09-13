import { useQuery } from "@tanstack/react-query";
import { addressService } from "@/api/services/address.service";
import { queryKeys } from "@/api/query-keys";

export function useAddressesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.addresses.all,
    queryFn: () => addressService.list(),
    enabled,
  });
}
