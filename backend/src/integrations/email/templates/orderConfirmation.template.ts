import { env } from "../../../config/env";
import type { IOrder } from "../../../models/Order";

/**
 * All order data injected here comes from the server-persisted Order document — never
 * from client-supplied request data — per the checkout flow in order.service.ts, which
 * always recomputes prices/totals from MongoDB. Still escaped defensively below since a
 * customer controls several free-text fields (name, address, notes) that end up in HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Carte bancaire",
  paypal: "PayPal",
  bank_transfer: "Virement bancaire",
  cash_on_delivery: "Paiement à la livraison",
  mobile_money: "Mobile money",
};

export interface OrderConfirmationEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildOrderConfirmationEmail(order: IOrder): OrderConfirmationEmail {
  const currency = order.currency;
  const orderDate = formatDate(order.createdAt);
  const orderUrl = `${env.FRONTEND_URL}/orders/${order._id}`;
  const paymentMethodLabel = PAYMENT_METHOD_LABELS[order.payment.method] ?? order.payment.method;
  const address = order.shippingAddress;

  const subject = `Votre commande ${order.orderNumber} est confirmée`;

  const itemRowsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;">${escapeHtml(item.productName)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;">${formatMoney(item.unitPrice, currency)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;text-align:right;">${formatMoney(item.subtotal, currency)}</td>
        </tr>`,
    )
    .join("");

  const itemRowsText = order.items
    .map(
      (item) =>
        `  - ${item.productName} | qté ${item.quantity} | ${formatMoney(item.unitPrice, currency)} / unité | sous-total ${formatMoney(item.subtotal, currency)}`,
    )
    .join("\n");

  const html = `
<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#18181b;color:#ffffff;padding:20px 24px;">
                <h1 style="margin:0;font-size:18px;">Merci pour votre commande !</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 16px;font-size:15px;">
                  Bonjour ${escapeHtml(order.customerName)}, votre commande <strong>${escapeHtml(order.orderNumber)}</strong> du ${orderDate} est bien enregistrée.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:20px;">
                  <tr><td style="padding:4px 0;color:#71717a;width:160px;">Mode de paiement</td><td style="padding:4px 0;">${escapeHtml(paymentMethodLabel)}</td></tr>
                </table>

                <h2 style="font-size:14px;margin:0 0 8px;">Adresse de livraison</h2>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#3f3f46;">
                  ${escapeHtml(address.fullName)}<br/>
                  ${escapeHtml(address.line1)}${address.line2 ? `<br/>${escapeHtml(address.line2)}` : ""}<br/>
                  ${escapeHtml(address.city)}${address.state ? `, ${escapeHtml(address.state)}` : ""} ${escapeHtml(address.postalCode)}<br/>
                  ${escapeHtml(address.country)}
                </p>

                <h2 style="font-size:14px;margin:0 0 8px;">Articles commandés</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;margin-bottom:16px;">
                  <thead>
                    <tr style="background:#f4f4f5;">
                      <th style="padding:8px;text-align:left;">Produit</th>
                      <th style="padding:8px;text-align:center;">Qté</th>
                      <th style="padding:8px;text-align:right;">Prix unitaire</th>
                      <th style="padding:8px;text-align:right;">Sous-total</th>
                    </tr>
                  </thead>
                  <tbody>${itemRowsHtml}</tbody>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:20px;">
                  <tr><td style="padding:4px 0;color:#71717a;">Sous-total</td><td style="padding:4px 0;text-align:right;">${formatMoney(order.subtotal, currency)}</td></tr>
                  <tr><td style="padding:4px 0;color:#71717a;">Livraison</td><td style="padding:4px 0;text-align:right;">${formatMoney(order.shippingCost, currency)}</td></tr>
                  ${order.discount > 0 ? `<tr><td style="padding:4px 0;color:#71717a;">Réduction${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}</td><td style="padding:4px 0;text-align:right;">-${formatMoney(order.discount, currency)}</td></tr>` : ""}
                  <tr><td style="padding:8px 0 0;font-weight:bold;border-top:1px solid #e5e5e5;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:bold;border-top:1px solid #e5e5e5;">${formatMoney(order.total, currency)}</td></tr>
                </table>

                <a href="${orderUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;">Suivre ma commande</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Merci pour votre commande !

Commande n° ${order.orderNumber} du ${orderDate}

Mode de paiement: ${paymentMethodLabel}

Adresse de livraison:
${address.fullName}
${address.line1}${address.line2 ? `\n${address.line2}` : ""}
${address.city}${address.state ? `, ${address.state}` : ""} ${address.postalCode}
${address.country}

Articles commandés:
${itemRowsText}

Sous-total: ${formatMoney(order.subtotal, currency)}
Livraison: ${formatMoney(order.shippingCost, currency)}
${order.discount > 0 ? `Réduction${order.couponCode ? ` (${order.couponCode})` : ""}: -${formatMoney(order.discount, currency)}\n` : ""}Total: ${formatMoney(order.total, currency)}

Suivre ma commande: ${orderUrl}
`;

  return { subject, html, text };
}
