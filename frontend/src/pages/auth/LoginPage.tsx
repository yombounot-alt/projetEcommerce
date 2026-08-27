import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes.constants";
import { useLoginMutation } from "@/features/auth/api/useAuthMutations";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";
import { ROLE_HOME_ROUTE } from "@/utils/permissions";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values, {
      onSuccess: (session) => {
        toast.success(`Bienvenue, ${session.user.firstName} !`);
        const redirectFrom = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
        navigate(redirectFrom ?? ROLE_HOME_ROUTE[session.user.role], { replace: true });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Impossible de vous connecter.");
      },
    });
  }

  return (
    <div className="space-y-8">
      <Seo title="Connexion" noIndex />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Bon retour parmi nous</h1>
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link to={ROUTES.register} className="font-medium text-foreground underline underline-offset-4">
            Créer un compte
          </Link>
        </p>
        <p className="rounded-md bg-secondary px-3 py-2 text-xs text-secondary-foreground">
          Démo : admin@lumera.example · seller@lumera.example · customer@lumera.example (mot de passe libre, 8+ caractères)
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="vous@exemple.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Mot de passe</FormLabel>
                  <Link to={ROUTES.forgotPassword} className="text-xs text-muted-foreground hover:text-foreground">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">Se souvenir de moi</FormLabel>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
