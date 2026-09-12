import { ContentSections } from "@/components/common/ContentSections";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { ROUTES } from "@/constants/routes.constants";

const SECTIONS = [
  {
    heading: "Éditeur du site",
    paragraphs: [
      "Luméra — Enta Marché, Commune de Tombolia, Conakry, Rép. de Guinée. Contact : yombounot@gmail.com.",
    ],
  },
  {
    heading: "Hébergement",
    paragraphs: ["Le site est hébergé par un prestataire cloud tiers, dont les coordonnées sont disponibles sur demande."],
  },
  {
    heading: "Propriété intellectuelle",
    paragraphs: [
      "L'ensemble des contenus présents sur ce site (textes, visuels, logo) est la propriété de Luméra ou de ses partenaires et ne peut être reproduit sans autorisation.",
    ],
  },
];

export default function LegalNoticePage() {
  return (
    <div className="container-page py-10">
      <Seo title="Mentions légales" canonicalPath={ROUTES.legal.notice} />
      <PageHeader title="Mentions légales" />
      <ContentSections sections={SECTIONS} />
    </div>
  );
}
