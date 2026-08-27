import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Seo } from "@/components/common/Seo";
import { ROUTES } from "@/constants/routes.constants";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { useCreateOrderMutation } from "@/features/orders/api/useOrderMutations";
import { CheckoutStepper } from "@/features/checkout/components/CheckoutStepper";
import { CustomerInfoStep } from "@/features/checkout/components/CustomerInfoStep";
import { PaymentStep } from "@/features/checkout/components/PaymentStep";
import { ShippingAddressStep } from "@/features/checkout/components/ShippingAddressStep";
import { ShippingMethodStep } from "@/features/checkout/components/ShippingMethodStep";
import type { CustomerInfoValues, PaymentMethodValues, ShippingAddressValues, ShippingMethodValues } from "@/schemas/checkout.schema";
import { useAuthStore } from "@/store/authStore";
import { selectCartSubtotal, useCartStore } from "@/store/cartStore";

const STEPS = [
  { key: "customer", label: "Informations" },
  { key: "address", label: "Livraison" },
  { key: "method", label: "Mode de livraison" },
  { key: "payment", label: "Paiement" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const clearCart = useCartStore((state) => state.clear);
  const createOrder = useCreateOrderMutation();

  const [stepIndex, setStepIndex] = useState(0);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfoValues>({
    email: user?.email ?? "", firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: "",
  });
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressValues>({
    fullName: "", line1: "", city: "", postalCode: "", country: "France", phone: "", saveAddress: false,
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodValues>({ methodId: "standard" });
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("Livraison standard");

  if (items.length === 0) {
    return <Navigate to={ROUTES.cart} replace />;
  }

  function handlePaymentSubmit(payment: PaymentMethodValues) {
    createOrder.mutate(
      {
        customerId: user?.id ?? "guest",
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerEmail: customerInfo.email,
        items,
        shippingAddress: {
          id: "temp", label: "Livraison", fullName: shippingAddress.fullName, line1: shippingAddress.line1,
          line2: shippingAddress.line2, city: shippingAddress.city, postalCode: shippingAddress.postalCode,
          country: shippingAddress.country, phone: shippingAddress.phone, isDefault: false,
        },
        billingAddress: {
          id: "temp-billing", label: "Facturation", fullName: shippingAddress.fullName, line1: shippingAddress.line1,
          line2: shippingAddress.line2, city: shippingAddress.city, postalCode: shippingAddress.postalCode,
          country: shippingAddress.country, phone: shippingAddress.phone, isDefault: false,
        },
        shippingMethod: shippingLabel,
        shippingCost,
        discount: 0,
        paymentMethod: payment.method,
      },
      {
        onSuccess: (order) => {
          clearCart();
          toast.success("Votre commande a été confirmée !");
          navigate(ROUTES.orderConfirmation(order.orderNumber));
        },
        onError: () => {
          toast.error("Une erreur est survenue lors de la création de votre commande.");
        },
      },
    );
  }

  return (
    <div className="container-page py-10">
      <Seo title="Paiement" canonicalPath={ROUTES.checkout} noIndex />

      <h1 className="mb-6 font-heading text-3xl font-semibold text-foreground">Finaliser ma commande</h1>
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
              onNext={(values, cost, label) => {
                setShippingMethod(values);
                setShippingCost(cost);
                setShippingLabel(label);
                setStepIndex(3);
              }}
            />
          )}
          {stepIndex === 3 && (
            <PaymentStep
              defaultValues={{ method: "card", billingSameAsShipping: true }}
              isSubmitting={createOrder.isPending}
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
