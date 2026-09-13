import { CheckCircle2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes.constants";

const BENEFITS = [
  "Un tableau de bord dédié pour gérer votre catalogue, vos stocks et vos commandes.",
  "Un paiement suivi et sécurisé pour chaque vente réalisée sur la plateforme.",
  "Une visibilité auprès de l'ensemble des clients Luméra, sans frais de mise en avant cachés.",
];

export default function SellWithUsPage() {
  return (
    <div className="container-page py-10">
      <Seo title="Devenir vendeur" canonicalPath={ROUTES.sellWithUs} />
      <PageHeader
        title="Devenir vendeur sur Luméra"
        description="Vendez vos produits à nos clients, avec les outils qu'il faut pour gérer votre activité au quotidien."
      />

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <ul className="space-y-4">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-3 text-sm text-muted-foreground">
              <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              {benefit}
            </li>
          ))}
        </ul>

        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm font-medium text-foreground">Comment ça marche</p>
            <p className="text-sm text-muted-foreground">
              Les espaces vendeurs sont activés manuellement par notre équipe. Créez d'abord un
              compte client, puis contactez-nous pour que nous activions votre accès vendeur.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to={ROUTES.register}>Créer un compte</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={ROUTES.help.contact}>Nous contacter</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
