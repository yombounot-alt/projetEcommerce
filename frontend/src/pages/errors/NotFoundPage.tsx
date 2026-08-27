import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes.constants";

export default function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <Seo title="Page introuvable" noIndex />
      <p className="font-heading text-7xl font-semibold text-foreground">404</p>
      <p className="text-lg font-medium text-foreground">Cette page n'existe pas ou plus.</p>
      <p className="max-w-md text-sm text-muted-foreground">
        Le lien que vous avez suivi est peut-être incorrect, ou la page a été déplacée.
      </p>
      <Button asChild>
        <Link to={ROUTES.home}>
          <ArrowLeftIcon /> Retour à l'accueil
        </Link>
      </Button>
    </div>
  );
}
