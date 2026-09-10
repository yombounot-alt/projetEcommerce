import { BellIcon, MenuIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UserMenu } from "@/components/layout/UserMenu";
import type { DashboardNavItem } from "@/components/layout/DashboardSidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useMarkNotificationAsReadMutation } from "@/features/notifications/api/useNotificationMutations";
import { useNotificationsQuery } from "@/features/notifications/api/useNotificationsQuery";
import { formatRelativeTime } from "@/utils/format";

interface DashboardHeaderProps {
  breadcrumb?: ReactNode;
  navItems: DashboardNavItem[];
  sectionLabel: string;
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export function DashboardHeader({
  breadcrumb,
  navItems,
  sectionLabel,
  isMobileOpen,
  onMobileOpenChange,
}: DashboardHeaderProps) {
  const { data } = useNotificationsQuery();
  const markAsRead = useMarkNotificationAsReadMutation();
  const notifications = data?.items ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Sheet open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => onMobileOpenChange(true)}
          aria-label="Ouvrir la navigation"
        >
          <MenuIcon className="size-5" />
        </Button>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <DashboardSidebar items={navItems} sectionLabel={sectionLabel} onNavigate={() => onMobileOpenChange(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1">{breadcrumb}</div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <BellIcon className="size-5" />
            {hasUnread && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">Aucune notification.</p>
          )}
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex-col items-start gap-0.5"
              onSelect={() => !notification.isRead && markAsRead.mutate(notification.id)}
            >
              <span className={notification.isRead ? "text-sm text-muted-foreground" : "text-sm font-medium text-foreground"}>
                {notification.message}
              </span>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(new Date(notification.createdAt))}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserMenu />
    </header>
  );
}
