import { Outlet } from "react-router-dom";
import { Logo } from "@/components/layout/Logo";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8">
        <Logo />
        <div className="mx-auto w-full max-w-sm py-12">
          <Outlet />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Luméra. Tous droits réservés.
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--accent)_35%,transparent),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-primary-foreground">
          <blockquote className="max-w-md space-y-4">
            <p className="font-heading text-2xl leading-snug">
              « Une expérience d'achat fluide, élégante, et pensée pour durer. »
            </p>
            <p className="text-sm text-primary-foreground/70">
              L'équipe Luméra — au service de vos achats depuis le premier clic jusqu'à la livraison.
            </p>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
