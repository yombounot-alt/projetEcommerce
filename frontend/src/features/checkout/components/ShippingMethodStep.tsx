import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EXPRESS_SHIPPING_COST, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from "@/constants/app.constants";
import { shippingMethodSchema, type ShippingMethodValues } from "@/schemas/checkout.schema";
import { formatPrice } from "@/utils/format";

interface ShippingMethodStepProps {
  subtotal: number;
  defaultValues: ShippingMethodValues;
  onNext: (values: ShippingMethodValues, cost: number, label: string) => void;
  onBack: () => void;
}

export function ShippingMethodStep({ subtotal, defaultValues, onNext, onBack }: ShippingMethodStepProps) {
  const isFreeStandard = subtotal >= FREE_SHIPPING_THRESHOLD;
  const methods = [
    {
      id: "standard",
      label: "Livraison standard",
      description: "3 à 5 jours ouvrés",
      cost: isFreeStandard ? 0 : STANDARD_SHIPPING_COST,
    },
    {
      id: "express",
      label: "Livraison express",
      description: "1 à 2 jours ouvrés",
      cost: EXPRESS_SHIPPING_COST,
    },
    { id: "pickup", label: "Point relais", description: "2 à 4 jours ouvrés", cost: 2.99 },
  ];

  const form = useForm<ShippingMethodValues>({
    resolver: zodResolver(shippingMethodSchema),
    defaultValues,
  });

  function handleSubmit(values: ShippingMethodValues) {
    const method = methods.find((m) => m.id === values.methodId);
    onNext(values, method?.cost ?? 0, method?.label ?? "Livraison standard");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="methodId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-3">
                  {methods.map((method) => (
                    <Label
                      key={method.id}
                      htmlFor={method.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-input p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{method.label}</p>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {method.cost === 0 ? "Gratuit" : formatPrice(method.cost)}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack}>Retour</Button>
          <Button type="submit" size="lg">Continuer</Button>
        </div>
      </form>
    </Form>
  );
}
