import { useState } from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControl } from "@/components/common/PaginationControl";
import { SearchBar } from "@/components/common/SearchBar";
import { Seo } from "@/components/common/Seo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateUserRoleMutation, useUsersQuery } from "@/features/users/api/useUsersQuery";
import { formatDate, getInitials } from "@/utils/format";
import type { Role, User } from "@/types/user.types";

const ROLE_LABELS: Record<Role, string> = { admin: "Administrateur", seller: "Vendeur", customer: "Client" };

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsersQuery({ search, page, pageSize: 10 });
  const updateRole = useUpdateUserRoleMutation();

  const columns: DataTableColumn<User>[] = [
    {
      key: "user",
      header: "Utilisateur",
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={user.avatarUrl} alt={user.firstName} />
            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rôle",
      render: (user) => (
        <Select
          value={user.role}
          onValueChange={(role) =>
            updateRole.mutate({ id: user.id, role: role as Role }, { onSuccess: () => toast.success("Rôle mis à jour.") })
          }
        >
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
              <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (user) => (
        <Badge variant={user.status === "active" ? "success" : user.status === "pending" ? "warning" : "destructive"}>
          {user.status === "active" ? "Actif" : user.status === "pending" ? "En attente" : "Suspendu"}
        </Badge>
      ),
    },
    { key: "createdAt", header: "Inscrit le", render: (user) => formatDate(user.createdAt) },
    {
      key: "lastActive",
      header: "Dernière activité",
      render: (user) => (user.lastActiveAt ? formatDate(user.lastActiveAt) : "—"),
    },
  ];

  return (
    <div className="space-y-6">
      <Seo title="Gestion des utilisateurs" noIndex />
      <PageHeader title="Utilisateurs" description="Gérez les comptes clients, vendeurs et administrateurs." />

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Nom ou email…" className="max-w-sm" />

      <DataTable columns={columns} data={data?.items ?? []} rowKey={(u) => u.id} isLoading={isLoading} />

      {data && <PaginationControl pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
