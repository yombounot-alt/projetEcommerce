import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControl } from "@/components/common/PaginationControl";
import { SearchBar } from "@/components/common/SearchBar";
import { Seo } from "@/components/common/Seo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsersQuery } from "@/features/users/api/useUsersQuery";
import { formatDate, getInitials } from "@/utils/format";
import type { User } from "@/types/user.types";

export default function SellerCustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsersQuery({ search, role: "customer", page, pageSize: 10 });

  const columns: DataTableColumn<User>[] = [
    {
      key: "user",
      header: "Client",
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
    { key: "createdAt", header: "Client depuis", render: (u) => formatDate(u.createdAt) },
    { key: "lastActive", header: "Dernière activité", render: (u) => (u.lastActiveAt ? formatDate(u.lastActiveAt) : "—") },
  ];

  return (
    <div className="space-y-6">
      <Seo title="Mes clients" noIndex />
      <PageHeader title="Clients" description="Clients ayant acheté vos produits." />

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Nom ou email…" className="max-w-sm" />

      <DataTable columns={columns} data={data?.items ?? []} rowKey={(u) => u.id} isLoading={isLoading} />

      {data && <PaginationControl pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
