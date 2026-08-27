import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes.constants";
import { useForgotPasswordMutation } from "@/features/auth/api/useAuthMutations";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/schemas/auth.schema";

export default function ForgotPasswordPage() {
  const mutation = useForgotPasswordMutation();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  if (mutation.isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <Seo title="Email envoyé" noIndex />
        <MailCheckIcon className="mx-auto size-10 text-success" />
        <h1 className="font-heading text-2xl font-semibold text-foreground">Vérifiez votre boîte mail</h1>
        <p className="text-sm text-muted-foreground">{mutation.data.message}</p>
        <Button asChild variant="outline" className="w-full">
          <Link to={ROUTES.login}>Retour à la connexion</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Seo title="Mot de passe oublié" noIndex />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">
          Indiquez votre email : nous vous enverrons un lien de réinitialisation.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values.email))} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" autoComplete="email" placeholder="vous@exemple.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? "Envoi…" : "Envoyer le lien"}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to={ROUTES.login}>Retour à la connexion</Link>
          </Button>
        </form>
      </Form>
    </div>
  );
}
