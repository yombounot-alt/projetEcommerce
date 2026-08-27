import { MapPin, Heart, Package, User } from "lucide-react";
import { NavLink } from "react-router-dom";

import { ROUTES } from "@/constants/routes.constants";
import { cn } from "@/lib/utils";

const links = [
  { label: "Profil", to: ROUTES.profile, icon: User },
  { label: "Commandes", to: ROUTES.orders, icon: Package },
  { label: "Favoris", to: ROUTES.wishlist, icon: Heart },
  { label: "Adresses", to: ROUTES.addresses, icon: MapPin },
];

export function AccountNav() {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-border pb-px">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium text-muted-foreground",
              isActive ? "border-primary text-foreground" : "border-transparent hover:text-foreground",
            )
          }
        >
          <link.icon className="size-4" />
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
