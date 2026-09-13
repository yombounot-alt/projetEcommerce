import { ContentSections } from "@/components/common/ContentSections";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import {
  EXPRESS_SHIPPING_COST,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
} from "@/constants/app.constants";
import { ROUTES } from "@/constants/routes.constants";
import { formatPrice } from "@/utils/format";

export default function ShippingReturnsPage() {
  const sections = [
    {
      heading: "Modes de livraison",
      paragraphs: [
        `Livraison standard : ${formatPrice(STANDARD_SHIPPING_COST)}, sous 3 à 5 jours ouvrés.`,
        `Livraison express : ${formatPrice(EXPRESS_SHIPPING_COST)}, sous 1 à 2 jours ouvrés.`,
        `La livraison est offerte dès ${formatPrice(FREE_SHIPPING_THRESHOLD)} d'achat, tous modes confondus.`,
      ],
    },
    {
      heading: "Suivi de commande",
      paragraphs: [
        "Une fois votre commande confirmée, vous pouvez suivre son statut à tout moment depuis votre espace « Mes commandes ».",
      ],
    },
    {
      heading: "Retours et remboursements",
      paragraphs: [
        "Vous disposez de 14 jours à compter de la réception pour nous retourner un article qui ne vous convient pas, dans son emballage d'origine et non utilisé.",
        "Le remboursement est effectué sur le moyen de paiement utilisé lors de l'achat, dans un délai de 5 à 10 jours ouvrés après réception et vérification du retour.",
      ],
    },
  ];

  return (
    <div className="container-page py-10">
      <Seo title="Livraison & retours" canonicalPath={ROUTES.help.shipping} />
      <PageHeader title="Livraison & retours" description="Délais, coûts et modalités de retour." />
      <ContentSections sections={sections} />
    </div>
  );
}
