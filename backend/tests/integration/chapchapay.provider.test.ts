import crypto from "crypto";
import { env } from "../../src/config/env";
import { ChapchaPayProvider } from "../../src/integrations/payment/providers/chapchapay.provider";

const TEST_SECRET = "test_hmac_secret_for_chapchapay_unit_tests";

/**
 * Payload shape confirmed against a real delivered ChapchaPay webhook (2026-09-13, live
 * "Kulu" test payment, order LUM-102345) — see the provider's class-level comment. The key
 * surprise this locks in: `status` is a nested object (`status.code`), not a flat string.
 */
function realWebhookBody(overrides: Partial<{ statusCode: string }> = {}): string {
  return JSON.stringify({
    order_id: "6aa70e471d8703537719bf1e",
    operation_id: "d57e9ea2-6397-44fb-929b-fe556e3529fe",
    amount: 2500000,
    description: "",
    status: {
      code: overrides.statusCode ?? "success",
      description: "Paiement Kulu effectué avec succès",
    },
    transaction: {
      payment_method: "kulu",
      payment_method_reference: "01a09c90-b9c0-727a-9db0-b56fbc0d2a75",
      payer_info: "224620617279",
      payment_reference: "ECOM-KUL-20260913205902-32F4FE3F",
      payment_description: "Paiement Kulu de 224620617279",
      transaction_date: "13/09/2026 20:59:02",
    },
  });
}

function sign(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(Buffer.from(body, "utf8")).digest("hex");
}

describe("ChapchaPayProvider#parseWebhook", () => {
  const originalSecret = env.CHAPCHAPAY_HMAC_SECRET;

  beforeAll(() => {
    env.CHAPCHAPAY_HMAC_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    env.CHAPCHAPAY_HMAC_SECRET = originalSecret;
  });

  const provider = new ChapchaPayProvider();

  it("parses a real-shaped success webhook and extracts status.code correctly", () => {
    const body = realWebhookBody();
    const event = provider.parseWebhook(Buffer.from(body, "utf8"), {
      "ccp-hmac-signature": sign(body, TEST_SECRET),
    });

    expect(event.status).toBe("captured");
    expect(event.transactionId).toBe("d57e9ea2-6397-44fb-929b-fe556e3529fe");
    expect(event.amount).toBe(2500000);
    expect(event.currency).toBe("GNF");
    expect(event.eventId).toBe("d57e9ea2-6397-44fb-929b-fe556e3529fe:success");
  });

  it("rejects a webhook with a missing signature header", () => {
    const body = realWebhookBody();
    expect(() => provider.parseWebhook(Buffer.from(body, "utf8"), {})).toThrow(
      "Signature CCP-HMAC-Signature manquante",
    );
  });

  it("rejects a webhook with an invalid signature", () => {
    const body = realWebhookBody();
    expect(() =>
      provider.parseWebhook(Buffer.from(body, "utf8"), { "ccp-hmac-signature": "wrong-signature" }),
    ).toThrow("Signature CCP-HMAC-Signature invalide");
  });

  it("rejects a payload whose status object has no code", () => {
    const body = JSON.stringify({
      order_id: "abc",
      operation_id: "op-1",
      amount: 100,
      status: {},
    });
    expect(() =>
      provider.parseWebhook(Buffer.from(body, "utf8"), {
        "ccp-hmac-signature": sign(body, TEST_SECRET),
      }),
    ).toThrow("Payload webhook ChapchaPay incomplet");
  });
});
