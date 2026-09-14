import axios from "axios";
import crypto from "crypto";
import { env } from "../../../config/env";
import { logger } from "../../../utils/logger";
import { BadRequestError, UnauthorizedError } from "../../../utils/AppError";
import type { PaymentProvider } from "../payment.interface";
import type {
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProviderStatus,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentResult,
  WebhookEvent,
} from "../payment.types";

/**
 * ChapchaPay adapter (https://chapchappay.com/guide/) — payment gateway for the Guinea
 * market (Orange Money, MTN MoMo, PayCard, Visa/Mastercard...), currency GNF.
 *
 * IMPORTANT — what is confirmed vs. assumed:
 * - E-commerce operation creation (`initializePayment`): verified with a real test API key
 *   against the live API on 2026-09-12. The public guide documents the path as
 *   `POST /ecommerce/operation`, but that path actually serves the HTML guide page itself
 *   (405 Method Not Allowed on POST — confirmed by direct curl). The real, working path is
 *   `POST {base}/ecommerce/create` (confirmed: real 201 response, echoing the merchant's
 *   actual account name). Header `CCP-Api-Key`, body `{amount, order_id, notify_url}` (all
 *   three confirmed accepted), response
 *   `{business_name, website_info, payment_methods, order_id, operation_id, amount,
 *   amount_formatted, description, payment_url, fee_handling_mode}`.
 * - `notify_url` must be HTTPS — confirmed by the live API itself: a plain http:// value is
 *   rejected with 400 `{"message": "Le champ [ notify_url ] doit utiliser le protocole HTTPS."}`.
 *   In local dev, `BACKEND_PUBLIC_URL` must point at an HTTPS tunnel (ngrok, Cloudflare
 *   Tunnel...) or every initialize call will fail with this exact error.
 * - Webhooks: confirmed against a real delivered webhook (2026-09-13, live "Kulu" test payment,
 *   order LUM-102345). Real payload shape:
 *   `{ order_id, operation_id, amount, description, status: { code, description },
 *     transaction: { payment_method, payment_method_reference, payer_info, payment_reference,
 *     transaction_date } }` — note `status` is a NESTED OBJECT (`status.code`), not the flat
 *   string the operation-creation response's field names would suggest. Signature confirmed:
 *   `CCP-HMAC-Signature` = `hex(HMAC-SHA256(CHAPCHAPAY_HMAC_SECRET, <raw request body>))`.
 *   Only `status.code === "success"` has been observed for real; the other codes below are
 *   still a best guess — confirm against a real failed/expired payload if one is ever received.
 * - `verifyPayment` (status polling) and `refundPayment` (PUSH API) are not documented at
 *   all in the public guide, so no request is invented for them — they throw a clear error
 *   instead of guessing an endpoint that could silently do the wrong thing with real money.
 */
export class ChapchaPayProvider implements PaymentProvider {
  readonly name = "chapchapay";

  private get apiKey(): string {
    if (!env.CHAPCHAPAY_API_KEY) {
      throw new Error(
        "CHAPCHAPAY_API_KEY n'est pas configurée. Renseignez-la dans le fichier .env.",
      );
    }
    return env.CHAPCHAPAY_API_KEY;
  }

  private get notifyUrl(): string {
    return `${env.BACKEND_PUBLIC_URL}${env.API_PREFIX}/payments/webhook/${this.name}`;
  }

  async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    if (input.currency !== "GNF") {
      throw new BadRequestError(
        `ChapchaPay ne supporte que le Franc Guinéen (GNF), pas "${input.currency}"`,
        "UNSUPPORTED_CURRENCY",
      );
    }

    const response = await axios.post<{
      business_name: string;
      operation_id: string;
      order_id?: string | null;
      amount: number;
      amount_formatted: string;
      payment_url: string;
      payment_methods: string[];
      fee_handling_mode?: string;
    }>(
      `${env.CHAPCHAPAY_BASE_URL}/ecommerce/create`,
      {
        amount: Math.round(input.amount),
        order_id: input.orderId,
        notify_url: this.notifyUrl,
      },
      {
        headers: {
          "CCP-Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        timeout: 15_000,
      },
    );

    const data = response.data;

    return {
      provider: this.name,
      transactionId: data.operation_id,
      status: "pending",
      redirectUrl: data.payment_url,
      raw: data as unknown as Record<string, unknown>,
    };
  }

  async verifyPayment(_transactionId: string): Promise<VerifyPaymentResult> {
    throw new Error(
      "ChapchaPay: aucun endpoint de vérification de statut n'est documenté publiquement. " +
        "Le statut du paiement est mis à jour exclusivement via le webhook " +
        "(POST /payments/webhook/chapchapay). Consultez la Référence API " +
        "(https://chapchappay.com/api/, après connexion) pour un éventuel endpoint de " +
        "consultation, puis complétez cette méthode.",
    );
  }

  async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentResult> {
    throw new Error(
      "ChapchaPay: le remboursement nécessite l'API PUSH, dont l'endpoint exact, le format " +
        "de requête et la signature HMAC ne sont pas documentés publiquement. Consultez la " +
        "Référence API (https://chapchappay.com/api/, après connexion) puis complétez cette " +
        "méthode — ne procédez pas à un remboursement manuel via le PUSH API tant que ce " +
        "point n'est pas confirmé.",
    );
  }

  /**
   * Verifies `CCP-HMAC-Signature` against the raw request body before trusting anything
   * in it — an invalid/missing signature always throws, it never falls through to
   * "unsigned but accepted". See the class-level comment: the exact signing string is
   * assumed to be the raw body; confirm against ChapchaPay's real reference before
   * processing real webhooks in production.
   */
  parseWebhook(
    rawBody: Buffer | string,
    headers: Record<string, string | string[] | undefined>,
  ): WebhookEvent {
    if (!env.CHAPCHAPAY_HMAC_SECRET) {
      throw new Error(
        "CHAPCHAPAY_HMAC_SECRET n'est pas configurée. Impossible de vérifier les webhooks.",
      );
    }

    const signatureHeader = headers["ccp-hmac-signature"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature) {
      throw new UnauthorizedError(
        "Signature CCP-HMAC-Signature manquante",
        "WEBHOOK_SIGNATURE_MISSING",
      );
    }

    const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
    const expectedSignature = crypto
      .createHmac("sha256", env.CHAPCHAPAY_HMAC_SECRET)
      .update(bodyBuffer)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const isValid =
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      logger.warn("ChapchaPay webhook: signature HMAC invalide, requête rejetée");
      throw new UnauthorizedError(
        "Signature CCP-HMAC-Signature invalide",
        "WEBHOOK_SIGNATURE_INVALID",
      );
    }

    let payload: {
      operation_id?: string;
      order_id?: string;
      status?: { code?: string; description?: string };
      amount?: number;
      description?: string;
      transaction?: Record<string, unknown>;
    };
    try {
      payload = JSON.parse(bodyBuffer.toString("utf8"));
    } catch {
      throw new BadRequestError("Corps du webhook ChapchaPay invalide (JSON attendu)");
    }

    const statusCode = payload.status?.code;
    if (!payload.operation_id || !statusCode || typeof payload.amount !== "number") {
      throw new BadRequestError(
        "Payload webhook ChapchaPay incomplet (operation_id, status.code, amount requis)",
        "WEBHOOK_PAYLOAD_INVALID",
      );
    }

    // No dedicated event id is documented for ChapchaPay webhooks — combining operation_id
    // with status makes each distinct status transition idempotent (a duplicate delivery
    // of the same status is a no-op) while still letting failed -> success retries through.
    return {
      eventId: `${payload.operation_id}:${statusCode}`,
      transactionId: payload.operation_id,
      status: mapChapchaPayStatus(statusCode),
      amount: payload.amount,
      currency: "GNF",
      raw: payload as Record<string, unknown>,
    };
  }
}

function mapChapchaPayStatus(status: string): PaymentProviderStatus {
  switch (status) {
    case "success":
      return "captured";
    case "failed":
    case "canceled":
    case "expired":
    case "error":
      return "failed";
    default:
      throw new BadRequestError(`Statut ChapchaPay inconnu: "${status}"`, "WEBHOOK_UNKNOWN_STATUS");
  }
}
