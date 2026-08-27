import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface IconLinkButtonProps {
  to: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  onClick?: () => void;
}

export function IconLinkButton({ to, icon: Icon, label, count = 0, onClick }: IconLinkButtonProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-label={label}
      className="relative inline-flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary"
    >
      <Icon className="size-5" />
      {count > 0 && (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
