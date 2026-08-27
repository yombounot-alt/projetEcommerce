import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCardIcon, LandmarkIcon, TruckIcon, WalletIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { paymentMethodSchema, type PaymentMethodValues } from "@/schemas/checkout.schema";

const PAYMENT_METHODS = [
  { id: "card", label: "Carte bancaire", icon: CreditCardIcon },
  { id: "paypal", label: "PayPal", icon: WalletIcon },
  { id: "bank_transfer", label: "Virement bancaire", icon: LandmarkIcon },
  { id: "cash_on_delivery", label: "Paiement à la livraison", icon: TruckIcon },
] as const;

interface PaymentStepProps {
  defaultValues: PaymentMethodValues;
  isSubmitting: boolean;
  onSubmit: (values: PaymentMethodValues) => void;
  onBack: () => void;
}

export function PaymentStep({ defaultValues, isSubmitting, onSubmit, onBack }: PaymentStepProps) {
  const form = useForm<PaymentMethodValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <Label
                      key={method.id}
                      htmlFor={method.id}
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input p-4 text-center has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
                    >
                      <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                      <method.icon className="size-6 text-foreground" />
                      <span className="text-sm font-medium text-foreground">{method.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingSameAsShipping"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Adresse de facturation identique à l'adresse de livraison</FormLabel>
            </FormItem>
          )}
        />

        <Alert>
          <AlertDescription>
            Par sécurité, aucune donnée bancaire n'est jamais saisie ou stockée sur ce site : le paiement sera
            finalisé via une passerelle de paiement certifiée (Stripe, PayPal…) lors de l'intégration backend.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack}>Retour</Button>
          <Button type="submit" size="lg" variant="accent" disabled={isSubmitting}>
            {isSubmitting ? "Traitement…" : "Confirmer et payer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
