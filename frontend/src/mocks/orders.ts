import { mockProducts } from "./products";
import { mockUsers } from "./users";
import type { Order, OrderItem, OrderStatus, PaymentMethod } from "@/types/order.types";
import type { Address } from "@/types/user.types";

function createRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = createRng(99);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

const statuses: OrderStatus[] = [
  "pending", "paid", "processing", "shipped", "delivered", "delivered", "delivered", "cancelled", "refunded",
];
const paymentMethods: PaymentMethod[] = ["card", "card", "card", "paypal", "bank_transfer"];
const shippingMethods = ["Livraison standard", "Livraison express", "Point relais"];
const cities = [
  { city: "Paris", postalCode: "75001", country: "France" },
  { city: "Lyon", postalCode: "69001", country: "France" },
  { city: "Marseille", postalCode: "13001", country: "France" },
  { city: "Bruxelles", postalCode: "1000", country: "Belgique" },
  { city: "Genève", postalCode: "1200", country: "Suisse" },
  { city: "Montréal", postalCode: "H2X", country: "Canada" },
];

function buildAddress(fullName: string): Address {
  const location = pick(cities);
  return {
    id: `addr-${Math.floor(rng() * 1_000_000)}`,
    label: "Domicile",
    fullName,
    line1: `${randInt(1, 180)} rue des Lilas`,
    city: location.city,
    postalCode: location.postalCode,
    country: location.country,
    phone: `+33 6 ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)}`,
    isDefault: true,
  };
}

function generateOrders(): Order[] {
  const orders: Order[] = [];
  const customers = mockUsers.filter((u) => u.role === "customer");

  for (let i = 0; i < 60; i += 1) {
    const customer = pick(customers);
    const itemCount = randInt(1, 4);
    const items: OrderItem[] = [];
    let subtotal = 0;

    for (let j = 0; j < itemCount; j += 1) {
      const product = pick(mockProducts);
      const quantity = randInt(1, 3);
      const itemSubtotal = Number((product.price * quantity).toFixed(2));
      subtotal += itemSubtotal;
      items.push({
        id: `item-${i}-${j}`,
        productId: product.id,
        productName: product.name,
        productImage: product.images[0],
        sku: product.sku,
        unitPrice: product.price,
        quantity,
        subtotal: itemSubtotal,
      });
    }

    const status = pick(statuses);
    const shippingCost = subtotal > 75 ? 0 : 4.99;
    const discount = rng() > 0.75 ? Number((subtotal * 0.1).toFixed(2)) : 0;
    const total = Number((subtotal + shippingCost - discount).toFixed(2));
    const fullName = `${customer.firstName} ${customer.lastName}`;
    const createdAt = new Date(Date.now() - randInt(0, 365) * 86_400_000);

    orders.push({
      id: `order-${(i + 1).toString().padStart(5, "0")}`,
      orderNumber: `LUM-${(100000 + i).toString()}`,
      customerId: customer.id,
      customerName: fullName,
      customerEmail: customer.email,
      items,
      status,
      shippingAddress: buildAddress(fullName),
      billingAddress: buildAddress(fullName),
      shippingMethod: pick(shippingMethods),
      shippingCost,
      discount,
      couponCode: discount > 0 ? "WELCOME10" : undefined,
      subtotal: Number(subtotal.toFixed(2)),
      total,
      currency: "GNF",
      payment: {
        id: `pay-${i}`,
        method: pick(paymentMethods),
        status: status === "cancelled" ? "failed" : status === "refunded" ? "refunded" : "captured",
        amount: total,
        currency: "GNF",
        processedAt: createdAt.toISOString(),
        providerReference: `ref_${Math.random().toString(36).slice(2, 12)}`,
      },
      createdAt: createdAt.toISOString(),
      updatedAt: new Date(createdAt.getTime() + randInt(0, 5) * 86_400_000).toISOString(),
    });
  }

  return orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const mockOrders: Order[] = generateOrders();

export function getOrdersByCustomer(customerId: string): Order[] {
  return mockOrders.filter((o) => o.customerId === customerId);
}

export function getOrderById(id: string): Order | undefined {
  return mockOrders.find((o) => o.id === id);
}

export function getOrderByNumber(orderNumber: string): Order | undefined {
  return mockOrders.find((o) => o.orderNumber === orderNumber);
}
