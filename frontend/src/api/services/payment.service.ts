import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { mockDelay } from "@/lib/mock-delay";
import { getOrderById } from "@/mocks/orders";
import type { Order, PaymentStatus } from "@/types/order.types";

const MANUAL_METHODS = new Set<Order["payment"]["method"]>(["cash_on_delivery", "bank_transfer"]);

export interface InitializePaymentResult {
  status: PaymentStatus;
  /** Present for gateway methods (ChapchaPay) — redirect the browser here to pay. */
  redirectUrl?: string;
}

export const paymentService = {
  /**
   * Deuxième étape du checkout, après la création de la commande (qui reste "pending"
   * tant que le paiement n'est pas initialisé — voir order.service.ts). cash_on_delivery et
   * bank_transfer sont réglés manuellement plus tard par un admin/vendeur (statut "pending" ici
   * est normal), les autres méthodes nécessitent une vraie passerelle configurée côté backend.
   */
  async initialize(orderId: string, method: Order["payment"]["method"]): Promise<InitializePaymentResult> {
    if (env.useMocks) {
      const status: PaymentStatus = MANUAL_METHODS.has(method) ? "pending" : "captured";
      const order = getOrderById(orderId);
      if (order) {
        order.payment.method = method;
        order.payment.status = status;
        if (status === "captured") {
          order.payment.processedAt = new Date().toISOString();
          order.status = "paid";
        }
        order.updatedAt = new Date().toISOString();
      }
      return mockDelay({ status }, 600);
    }
    const { data } = await httpClient.post<{ status: PaymentStatus; redirectUrl?: string }>(
      "/payments/initialize",
      { orderId, method },
    );
    return { status: data.status, redirectUrl: data.redirectUrl };
  },
};
