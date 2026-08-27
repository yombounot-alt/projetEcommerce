import { ArrowLeftIcon, ShieldAlertIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes.constants";

export default function ForbiddenPage() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <Seo title="Accès refusé" noIndex />
      <ShieldAlertIcon className="size-12 text-muted-foreground" />
      <p className="font-heading text-3xl font-semibold text-foreground">Accès refusé</p>
      <p className="max-w-md text-sm text-muted-foreground">
        Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
      </p>
      <Button asChild>
        <Link to={ROUTES.home}>
          <ArrowLeftIcon /> Retour à l'accueil
        </Link>
      </Button>
    </div>
  );
}
