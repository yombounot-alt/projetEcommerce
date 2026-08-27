import { LayoutDashboardIcon, LogOutIcon, MapPinIcon, PackageIcon, StoreIcon, UserIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLogoutMutation } from "@/features/auth/api/useAuthMutations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes.constants";
import { useAuthStore } from "@/store/authStore";
import { getInitials } from "@/utils/format";
import { canAccessAdmin, canAccessSeller } from "@/utils/permissions";

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();

  if (!user) {
    return (
      <Button asChild variant="ghost" size="icon" aria-label="Se connecter">
        <Link to={ROUTES.login}>
          <UserIcon className="size-5" />
        </Link>
      </Button>
    );
  }

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Vous avez été déconnecté.");
        navigate(ROUTES.home);
      },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Mon compte">
          <Avatar className="size-8">
            <AvatarImage src={user.avatarUrl} alt={user.firstName} />
            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={ROUTES.profile}><UserIcon /> Mon profil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.orders}><PackageIcon /> Mes commandes</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.addresses}><MapPinIcon /> Mes adresses</Link>
        </DropdownMenuItem>
        {canAccessAdmin(user.role) && (
          <DropdownMenuItem asChild>
            <Link to={ROUTES.admin.root}><LayoutDashboardIcon /> Dashboard admin</Link>
          </DropdownMenuItem>
        )}
        {canAccessSeller(user.role) && (
          <DropdownMenuItem asChild>
            <Link to={ROUTES.seller.root}><StoreIcon /> Espace vendeur</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOutIcon /> Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
