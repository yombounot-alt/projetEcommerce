import { ContentSections } from "@/components/common/ContentSections";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { ROUTES } from "@/constants/routes.constants";
import { formatDate } from "@/utils/format";

const SECTIONS = [
  {
    heading: "1. Objet",
    paragraphs: [
      "Les présentes conditions générales régissent l'utilisation de la plateforme Luméra et les ventes conclues entre les vendeurs référencés et les clients.",
    ],
  },
  {
    heading: "2. Commandes",
    paragraphs: [
      "Toute commande passée sur Luméra vaut acceptation des présentes conditions. Les prix, la disponibilité et les délais annoncés sont ceux en vigueur au moment de la validation de la commande.",
    ],
  },
  {
    heading: "3. Paiement",
    paragraphs: [
      "Le paiement est exigible au moment de la commande, à l'exception du paiement à la livraison. Toute commande est traitée après confirmation du paiement (ou à la livraison pour ce mode de règlement).",
    ],
  },
  {
    heading: "4. Livraison et retours",
    paragraphs: [
      "Les délais et coûts de livraison sont détaillés sur notre page Livraison & retours. Un droit de rétractation de 14 jours s'applique aux produits éligibles.",
    ],
  },
  {
    heading: "5. Responsabilité",
    paragraphs: [
      "Luméra met en relation vendeurs et clients et s'assure de la conformité du catalogue référencé. La responsabilité de Luméra ne saurait être engagée au-delà du prix de la commande concernée.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="container-page py-10">
      <Seo title="Conditions générales" canonicalPath={ROUTES.legal.terms} />
      <PageHeader title="Conditions générales de vente" description={`Dernière mise à jour : ${formatDate("2026-08-01")}`} />
      <ContentSections sections={SECTIONS} />
    </div>
  );
}
