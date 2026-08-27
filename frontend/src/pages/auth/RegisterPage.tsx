import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes.constants";
import { useRegisterMutation } from "@/features/auth/api/useAuthMutations";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth.schema";

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
      acceptTerms: false as unknown as true,
    },
  });

  function onSubmit(values: RegisterFormValues) {
    registerMutation.mutate(values, {
      onSuccess: (session) => {
        toast.success(`Bienvenue chez Luméra, ${session.user.firstName} !`);
        navigate(ROUTES.home);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Impossible de créer votre compte.");
      },
    });
  }

  return (
    <div className="space-y-8">
      <Seo title="Créer un compte" noIndex />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Créer votre compte</h1>
        <p className="text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link to={ROUTES.login} className="font-medium text-foreground underline underline-offset-4">
            Se connecter
          </Link>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl><Input autoComplete="given-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl><Input autoComplete="family-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl><Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} /></FormControl>
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
                <FormControl><Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal leading-snug">
                  J'accepte les{" "}
                  <Link to="/legal/terms" className="underline underline-offset-4">conditions générales</Link>{" "}
                  et la{" "}
                  <Link to="/legal/privacy" className="underline underline-offset-4">politique de confidentialité</Link>.
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Création du compte…" : "Créer mon compte"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
