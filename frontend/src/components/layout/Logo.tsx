import { Link } from "react-router-dom";
import logoMark from "@/assets/logo-mark.png";
import { APP_NAME } from "@/constants/app.constants";
import { ROUTES } from "@/constants/routes.constants";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to={ROUTES.home}
      className={cn("flex items-center gap-2 font-heading text-xl font-semibold tracking-tight text-foreground", className)}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary p-1">
        <img src={logoMark} alt="" className="size-full object-contain" />
      </span>
      {APP_NAME}
    </Link>
  );
}
