import { zodResolver } from "@hookform/resolvers/zod";
import { TagIcon, XIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { orderService } from "@/api/services/order.service";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { couponFormSchema, type CouponFormValues } from "@/schemas/profile.schema";
import type { Coupon } from "@/types/order.types";

interface CouponFormProps {
  subtotal: number;
  appliedCoupon?: Coupon | null;
  onApplied: (coupon: Coupon | null) => void;
}

export function CouponForm({ subtotal, appliedCoupon, onApplied }: CouponFormProps) {
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: { code: "" },
  });

  const applyCoupon = useMutation({
    mutationFn: (values: CouponFormValues) => orderService.applyCoupon(values.code, subtotal),
    onSuccess: (coupon) => {
      onApplied(coupon);
      toast.success(`Code ${coupon.code} appliqué.`);
      form.reset({ code: "" });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Code promo invalide ou expiré.");
    },
  });

  function handleRemove() {
    onApplied(null);
    form.reset({ code: "" });
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <TagIcon className="size-4 text-accent" />
          Code {appliedCoupon.code} appliqué
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
          <XIcon className="size-4" /> Retirer
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => applyCoupon.mutate(values))}
        className="flex items-start gap-2 rounded-xl border border-border p-3"
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem className="flex-1 space-y-0">
              <FormControl>
                <Input placeholder="Code promo" autoCapitalize="characters" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant="outline" disabled={applyCoupon.isPending}>
          {applyCoupon.isPending ? "Vérification…" : "Appliquer"}
        </Button>
      </form>
    </Form>
  );
}
