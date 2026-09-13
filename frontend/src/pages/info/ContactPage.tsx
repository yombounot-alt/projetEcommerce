import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes.constants";

const CHANNELS = [
  {
    icon: MailIcon,
    label: "Email",
    value: "support@lumera.example",
    href: "mailto:support@lumera.example",
  },
  { icon: PhoneIcon, label: "Téléphone", value: "+224 600 00 00 00", href: "tel:+224600000000" },
  { icon: MapPinIcon, label: "Adresse", value: "Conakry, Guinée", href: undefined },
];

export default function ContactPage() {
  return (
    <div className="container-page py-10">
      <Seo title="Contact" canonicalPath={ROUTES.help.contact} />
      <PageHeader
        title="Contactez-nous"
        description="Notre service client répond du lundi au samedi, de 9h à 18h (heure de Conakry)."
      />

      <div className="grid max-w-2xl gap-4">
        {CHANNELS.map(({ icon: Icon, label, value, href }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                {href ? (
                  <a href={href} className="text-sm font-medium text-foreground hover:underline">
                    {value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-foreground">{value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 max-w-2xl text-sm text-muted-foreground">
        Une question sur une commande en cours ? Consultez d'abord notre{" "}
        <Link
          to={ROUTES.help.faq}
          className="font-medium text-foreground underline underline-offset-4"
        >
          FAQ
        </Link>{" "}
        ou votre espace{" "}
        <Link
          to={ROUTES.orders}
          className="font-medium text-foreground underline underline-offset-4"
        >
          Mes commandes
        </Link>
        , la réponse s'y trouve souvent.
      </p>
    </div>
  );
}
