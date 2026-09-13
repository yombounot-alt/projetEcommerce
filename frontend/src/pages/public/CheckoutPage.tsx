import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Seo } from "@/components/common/Seo";
import { ROUTES } from "@/constants/routes.constants";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { useCart } from "@/features/cart/api/useCart";
import { useInitializePaymentMutation } from "@/features/checkout/api/usePaymentMutations";
import { useCreateOrderMutation } from "@/features/orders/api/useOrderMutations";
import { CheckoutStepper } from "@/features/checkout/components/CheckoutStepper";
import { CustomerInfoStep } from "@/features/checkout/components/CustomerInfoStep";
import { PaymentStep } from "@/features/checkout/components/PaymentStep";
import { ShippingAddressStep } from "@/features/checkout/components/ShippingAddressStep";
import { ShippingMethodStep } from "@/features/checkout/components/ShippingMethodStep";
import type {
  CustomerInfoValues,
  PaymentMethodValues,
  ShippingAddressValues,
  ShippingMethodValues,
} from "@/schemas/checkout.schema";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/types/api.types";

const STEPS = [
  { key: "customer", label: "Informations" },
  { key: "address", label: "Livraison" },
  { key: "method", label: "Mode de livraison" },
  { key: "payment", label: "Paiement" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { items, subtotal, isLoading: isCartLoading, clear: clearCart } = useCart();
  const createOrder = useCreateOrderMutation();
  const initializePayment = useInitializePaymentMutation();
  const isSubmitting = createOrder.isPending || initializePayment.isPending;

  const [stepIndex, setStepIndex] = useState(0);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfoValues>({
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: "",
  });
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressValues>({
    fullName: "",
    line1: "",
    city: "",
    postalCode: "",
    country: "France",
    phone: "",
    saveAddress: false,
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodValues>({
    methodId: "standard",
  });
  const [shippingCost, setShippingCost] = useState(0);

  // isCartLoading guards against a false-positive redirect: on a fresh page load the
  // server cart query hasn't resolved yet, so `items` is momentarily empty even for a
  // customer with a non-empty cart.
  if (!isCartLoading && items.length === 0) {
    return <Navigate to={ROUTES.cart} replace />;
  }

  function handlePaymentSubmit(payment: PaymentMethodValues) {
    createOrder.mutate(
      {
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName: shippingAddress.fullName,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone,
        },
        shippingMethod: shippingMethod.methodId,
        paymentMethod: payment.method,
      },
      {
        onSuccess: (order) => {
          clearCart();
          initializePayment.mutate(
            { orderId: order.id, method: payment.method },
            {
              onSuccess: ({ status, redirectUrl }) => {
                // card / mobile_money go through ChapchaPay: send the customer to their
                // hosted payment page. The order stays "pending" until their webhook confirms.
                if (redirectUrl) {
                  window.location.href = redirectUrl;
                  return;
                }
                toast.success(
                  status === "captured"
                    ? "Paiement confirmé, votre commande a été passée !"
                    : "Commande enregistrée — paiement en attente de confirmation.",
                );
                navigate(ROUTES.orderConfirmation(order.orderNumber));
              },
              onError: (error) => {
                toast.error(
                  error instanceof ApiError
                    ? error.message
                    : "Le paiement n'a pas pu être initialisé. Votre commande reste enregistrée.",
                );
                navigate(ROUTES.orderConfirmation(order.orderNumber));
              },
            },
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Une erreur est survenue lors de la création de votre commande.",
          );
        },
      },
    );
  }

  return (
    <div className="container-page py-10">
      <Seo title="Paiement" canonicalPath={ROUTES.checkout} noIndex />

      <h1 className="mb-6 font-heading text-3xl font-semibold text-foreground">
        Finaliser ma commande
      </h1>
      <CheckoutStepper steps={STEPS} currentIndex={stepIndex} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-xl border border-border p-6">
          {stepIndex === 0 && (
            <CustomerInfoStep
              defaultValues={customerInfo}
              onNext={(values) => {
                setCustomerInfo(values);
                setStepIndex(1);
              }}
            />
          )}
          {stepIndex === 1 && (
            <ShippingAddressStep
              defaultValues={shippingAddress}
              onBack={() => setStepIndex(0)}
              onNext={(values) => {
                setShippingAddress(values);
                setStepIndex(2);
              }}
            />
          )}
          {stepIndex === 2 && (
            <ShippingMethodStep
              subtotal={subtotal}
              defaultValues={shippingMethod}
              onBack={() => setStepIndex(1)}
              onNext={(values, cost) => {
                setShippingMethod(values);
                setShippingCost(cost);
                setStepIndex(3);
              }}
            />
          )}
          {stepIndex === 3 && (
            <PaymentStep
              defaultValues={{ method: "card", billingSameAsShipping: true }}
              isSubmitting={isSubmitting}
              onBack={() => setStepIndex(2)}
              onSubmit={handlePaymentSubmit}
            />
          )}
        </div>

        <CartSummary subtotal={subtotal} shippingCost={shippingCost} discount={0} />
      </div>
    </div>
  );
}
