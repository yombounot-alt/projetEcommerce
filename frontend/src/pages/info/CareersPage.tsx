import { MailIcon } from "lucide-react";
import { ContentSections } from "@/components/common/ContentSections";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { ROUTES } from "@/constants/routes.constants";

const SECTIONS = [
  {
    heading: "Pourquoi nous rejoindre",
    paragraphs: [
      "Nous construisons une plateforme e-commerce ambitieuse pour la Guinée et l'Afrique de l'Ouest, avec une équipe qui privilégie la qualité du produit et l'écoute des vendeurs comme des clients.",
    ],
  },
  {
    heading: "Postes ouverts",
    paragraphs: [
      "Nous n'avons pas d'offre publiée pour le moment. Nos besoins évoluent vite : si vous pensez avoir un profil utile à notre croissance (développement, logistique, service client, vente), n'hésitez pas à nous écrire.",
    ],
  },
];

export default function CareersPage() {
  return (
    <div className="container-page py-10">
      <Seo title="Carrières" canonicalPath={ROUTES.careers} />
      <PageHeader
        title="Carrières"
        description="Aucune offre en cours, mais nous lisons chaque candidature spontanée."
      />
      <ContentSections sections={SECTIONS} />
      <a
        href="mailto:carrieres@lumera.example"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4"
      >
        <MailIcon className="size-4" /> carrieres@lumera.example
      </a>
    </div>
  );
}
