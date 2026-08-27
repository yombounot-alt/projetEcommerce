import { ImageIcon, MessageCircleIcon, PlayCircleIcon, UsersIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/constants/app.constants";
import { ROUTES } from "@/constants/routes.constants";
import { Logo } from "./Logo";

const FOOTER_SECTIONS = [
  {
    title: "Boutique",
    links: [
      { label: "Tous les produits", to: ROUTES.shop },
      { label: "Nouveautés", to: `${ROUTES.shop}?sort=newest` },
      { label: "Promotions", to: `${ROUTES.shop}?onSale=true` },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Suivi de commande", to: ROUTES.orders },
      { label: "Livraison & retours", to: "/help/shipping" },
      { label: "Contact", to: "/help/contact" },
      { label: "FAQ", to: "/help/faq" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "À propos", to: "/about" },
      { label: "Carrières", to: "/careers" },
      { label: "Devenir vendeur", to: "/sell-with-us" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions générales", to: "/legal/terms" },
      { label: "Politique de confidentialité", to: "/legal/privacy" },
      { label: "Mentions légales", to: "/legal/notice" },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: ImageIcon, label: "Instagram", href: "https://instagram.com" },
  { icon: UsersIcon, label: "Facebook", href: "https://facebook.com" },
  { icon: MessageCircleIcon, label: "Twitter", href: "https://twitter.com" },
  { icon: PlayCircleIcon, label: "YouTube", href: "https://youtube.com" },
];

export function Footer() {
  const [email, setEmail] = useState("");

  function handleSubscribe(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    toast.success("Merci ! Vous êtes désormais inscrit à notre newsletter.");
    setEmail("");
  }

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            {APP_NAME} sélectionne pour vous des produits d'exception, livrés rapidement et
            garantis par un service client attentif.
          </p>
          <div className="flex gap-2">
            {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{section.title}</p>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <form onSubmit={handleSubscribe} className="flex w-full max-w-sm gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              aria-label="Adresse email pour la newsletter"
            />
            <Button type="submit" variant="accent" className="shrink-0">
              S'inscrire
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
