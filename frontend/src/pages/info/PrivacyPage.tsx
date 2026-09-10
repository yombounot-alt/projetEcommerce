import { ContentSections } from "@/components/common/ContentSections";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { ROUTES } from "@/constants/routes.constants";
import { formatDate } from "@/utils/format";

const SECTIONS = [
  {
    heading: "Données collectées",
    paragraphs: [
      "Nous collectons les informations que vous nous fournissez directement (identité, adresse, coordonnées) ainsi que les données liées à vos commandes et à votre navigation sur le site.",
    ],
  },
  {
    heading: "Utilisation des données",
    paragraphs: [
      "Vos données servent à traiter vos commandes, assurer le suivi de livraison, personnaliser votre expérience et vous contacter en cas de besoin concernant un achat.",
      "Aucune donnée bancaire n'est jamais stockée sur nos serveurs : le paiement est délégué à un prestataire tiers certifié.",
    ],
  },
  {
    heading: "Conservation et sécurité",
    paragraphs: [
      "Vos données sont conservées le temps nécessaire à la gestion de votre compte et de vos commandes, puis archivées ou supprimées conformément à nos obligations légales.",
    ],
  },
  {
    heading: "Vos droits",
    paragraphs: [
      "Vous pouvez à tout moment consulter, corriger ou demander la suppression de vos données personnelles depuis votre espace « Profil », ou en nous contactant directement.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-page py-10">
      <Seo title="Politique de confidentialité" canonicalPath={ROUTES.legal.privacy} />
      <PageHeader
        title="Politique de confidentialité"
        description={`Dernière mise à jour : ${formatDate("2026-08-01")}`}
      />
      <ContentSections sections={SECTIONS} />
    </div>
  );
}
