import { PageHeader } from "@/components/common/PageHeader";
import { ContentSections } from "@/components/common/ContentSections";
import { Seo } from "@/components/common/Seo";
import { ROUTES } from "@/constants/routes.constants";

const SECTIONS = [
  {
    heading: "Notre histoire",
    paragraphs: [
      "Luméra est née à Conakry avec une idée simple : proposer une expérience d'achat en ligne aussi soignée que celle d'une boutique physique, avec la rapidité et le confort du numérique.",
      "Depuis nos débuts, nous travaillons avec des vendeurs locaux et des marques partenaires pour construire un catalogue fiable, où chaque produit est vérifié avant d'être mis en ligne.",
    ],
  },
  {
    heading: "Notre mission",
    paragraphs: [
      "Rendre le commerce en ligne accessible, transparent et sans mauvaise surprise : prix clairs, stocks à jour en temps réel, livraison suivie de bout en bout.",
      "Nous croyons qu'un bon service client commence avant l'achat — c'est pourquoi notre catalogue, nos avis clients et notre suivi de commande sont pensés pour répondre à vos questions avant même que vous les posiez.",
    ],
  },
  {
    heading: "L'équipe",
    paragraphs: [
      "Une petite équipe basée en Guinée, entourée d'un réseau grandissant de vendeurs partenaires à travers le pays.",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="container-page py-10">
      <Seo title="À propos" canonicalPath={ROUTES.about} />
      <PageHeader
        title="À propos de Luméra"
        description="Qui nous sommes et pourquoi nous faisons ce métier."
      />
      <ContentSections sections={SECTIONS} />
    </div>
  );
}
