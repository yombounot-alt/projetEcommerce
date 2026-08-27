import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

export interface DashboardNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

interface DashboardSidebarProps {
  items: DashboardNavItem[];
  sectionLabel: string;
  onNavigate?: () => void;
}

export function DashboardSidebar({ items, sectionLabel, onNavigate }: DashboardSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between px-2 pt-2">
        <Logo />
      </div>

      <div className="space-y-1">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {sectionLabel}
        </p>
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Separator className="mt-auto" />
      <p className="px-2 text-xs text-muted-foreground">
        Environnement de démonstration — données mock.
      </p>
    </div>
  );
}
