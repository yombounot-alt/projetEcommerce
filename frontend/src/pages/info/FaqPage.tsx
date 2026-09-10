import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { FREE_SHIPPING_THRESHOLD } from "@/constants/app.constants";
import { ROUTES } from "@/constants/routes.constants";
import { formatPrice } from "@/utils/format";

const FAQ_ITEMS = [
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Carte bancaire, PayPal, virement bancaire, paiement à la livraison et mobile money, selon les méthodes activées lors de votre commande.",
  },
  {
    question: "Combien coûte la livraison ?",
    answer: `La livraison standard et express sont facturées selon le mode choisi au moment du paiement, et offerte dès ${formatPrice(FREE_SHIPPING_THRESHOLD)} d'achat.`,
  },
  {
    question: "Comment suivre ma commande ?",
    answer: "Rendez-vous dans votre espace « Mes commandes » une fois connecté : le statut y est mis à jour en temps réel.",
  },
  {
    question: "Puis-je retourner un produit ?",
    answer: "Oui, sous 14 jours à compter de la réception, dans son emballage d'origine. Voir notre page Livraison & retours pour le détail.",
  },
  {
    question: "Comment devenir vendeur sur Luméra ?",
    answer: "Créez un compte client puis contactez notre équipe : nous activons manuellement les espaces vendeurs après vérification.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-page py-10">
      <Seo title="FAQ" canonicalPath={ROUTES.help.faq} />
      <PageHeader title="Questions fréquentes" description="Les réponses aux questions les plus courantes." />

      <Accordion type="single" collapsible className="max-w-2xl">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.question} value={item.question}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
