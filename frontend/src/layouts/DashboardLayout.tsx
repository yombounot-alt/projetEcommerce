import { useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DashboardSidebar, type DashboardNavItem } from "@/components/layout/DashboardSidebar";

export type { DashboardNavItem };

interface DashboardLayoutProps {
  navItems: DashboardNavItem[];
  sectionLabel: string;
  children?: ReactNode;
}

export function DashboardLayout({ navItems, sectionLabel, children }: DashboardLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="grid min-h-screen lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-border lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <DashboardSidebar items={navItems} sectionLabel={sectionLabel} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <DashboardHeader
          navItems={navItems}
          sectionLabel={sectionLabel}
          isMobileOpen={isMobileNavOpen}
          onMobileOpenChange={setIsMobileNavOpen}
        />
        <main className="flex-1 bg-secondary/20 p-4 sm:p-6 lg:p-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
