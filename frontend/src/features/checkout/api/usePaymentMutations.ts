import { useMutation } from "@tanstack/react-query";
import { paymentService } from "@/api/services/payment.service";
import type { Order } from "@/types/order.types";

export function useInitializePaymentMutation() {
  return useMutation({
    mutationFn: ({ orderId, method }: { orderId: string; method: Order["payment"]["method"] }) =>
      paymentService.initialize(orderId, method),
  });
}
