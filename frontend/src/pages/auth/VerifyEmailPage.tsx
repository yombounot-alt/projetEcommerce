import { useEffect } from "react";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { LoadingState } from "@/components/common/LoadingState";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes.constants";
import { useVerifyEmailMutation } from "@/features/auth/api/useAuthMutations";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const mutation = useVerifyEmailMutation();

  useEffect(() => {
    if (token) mutation.mutate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <Seo title="Lien invalide" noIndex />
        <XCircleIcon className="mx-auto size-10 text-destructive" />
        <h1 className="font-heading text-2xl font-semibold text-foreground">Lien invalide</h1>
        <p className="text-sm text-muted-foreground">Ce lien de vérification est incomplet.</p>
        <Button asChild className="w-full"><Link to={ROUTES.home}>Retour à l'accueil</Link></Button>
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div className="space-y-4 text-center">
        <Seo title="Échec de la vérification" noIndex />
        <XCircleIcon className="mx-auto size-10 text-destructive" />
        <h1 className="font-heading text-2xl font-semibold text-foreground">Échec de la vérification</h1>
        <p className="text-sm text-muted-foreground">
          {mutation.error instanceof Error ? mutation.error.message : "Ce lien est invalide ou a expiré."}
        </p>
        <Button asChild className="w-full"><Link to={ROUTES.login}>Retour à la connexion</Link></Button>
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <Seo title="Email vérifié" noIndex />
        <CheckCircle2Icon className="mx-auto size-10 text-success" />
        <h1 className="font-heading text-2xl font-semibold text-foreground">Email vérifié !</h1>
        <p className="text-sm text-muted-foreground">{mutation.data.message}</p>
        <Button asChild className="w-full"><Link to={ROUTES.home}>Continuer</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <Seo title="Vérification en cours" noIndex />
      <LoadingState label="Vérification de votre email…" />
    </div>
  );
}
