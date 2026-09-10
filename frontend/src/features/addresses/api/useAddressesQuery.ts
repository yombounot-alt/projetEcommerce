import { useQuery } from "@tanstack/react-query";
import { addressService } from "@/api/services/address.service";
import { queryKeys } from "@/api/query-keys";

export function useAddressesQuery() {
  return useQuery({
    queryKey: queryKeys.addresses.all,
    queryFn: () => addressService.list(),
  });
}
