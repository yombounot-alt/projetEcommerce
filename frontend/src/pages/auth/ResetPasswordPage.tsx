import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes.constants";
import { useResetPasswordMutation } from "@/features/auth/api/useAuthMutations";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/schemas/auth.schema";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const mutation = useResetPasswordMutation();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  if (mutation.isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <Seo title="Mot de passe réinitialisé" noIndex />
        <CheckCircle2Icon className="mx-auto size-10 text-success" />
        <h1 className="font-heading text-2xl font-semibold text-foreground">C'est fait !</h1>
        <p className="text-sm text-muted-foreground">{mutation.data.message}</p>
        <Button asChild className="w-full">
          <Link to={ROUTES.login}>Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Seo title="Réinitialiser le mot de passe" noIndex />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground">Choisissez un nouveau mot de passe sécurisé.</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate({ token: values.token, password: values.password }))}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
