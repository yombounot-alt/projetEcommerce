import { zodResolver } from "@hookform/resolvers/zod";
import { StarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { reviewFormSchema, type ReviewFormValues } from "@/schemas/product.schema";

interface ReviewFormProps {
  isSubmitting: boolean;
  onSubmit: (values: ReviewFormValues) => void;
}

export function ReviewForm({ isSubmitting, onSubmit }: ReviewFormProps) {
  const form = useForm<z.input<typeof reviewFormSchema>, unknown, ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 0, title: "", comment: "" },
  });

  function handleSubmit(values: ReviewFormValues) {
    onSubmit(values);
    form.reset();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 rounded-xl border border-border p-4"
      >
        <p className="text-sm font-medium text-foreground">Laisser un avis</p>
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre note</FormLabel>
              <FormControl>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                    >
                      <StarIcon
                        className={cn(
                          "size-6 transition-colors",
                          value <= Number(field.value ?? 0)
                            ? "fill-accent text-accent"
                            : "fill-transparent text-border",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Résumez votre expérience" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre avis</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Décrivez votre expérience avec ce produit…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Envoi…" : "Publier mon avis"}
        </Button>
      </form>
    </Form>
  );
}
