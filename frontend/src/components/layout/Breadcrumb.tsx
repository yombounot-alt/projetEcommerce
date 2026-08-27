import { ChevronRightIcon, HomeIcon } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes.constants";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link to={ROUTES.home} className="flex items-center hover:text-foreground">
        <HomeIcon className="size-3.5" />
      </Link>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          <ChevronRightIcon className="size-3.5" />
          {item.to && index < items.length - 1 ? (
            <Link to={item.to} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
