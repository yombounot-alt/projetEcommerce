import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControl } from "@/components/common/PaginationControl";
import { SearchBar } from "@/components/common/SearchBar";
import { Seo } from "@/components/common/Seo";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useOrdersQuery } from "@/features/orders/api/useOrdersQuery";
import { formatDate, formatPrice } from "@/utils/format";
import type { Order } from "@/types/order.types";

export default function SellerOrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrdersQuery({ search, page, pageSize: 10 });

  const columns: DataTableColumn<Order>[] = [
    { key: "orderNumber", header: "Commande", render: (o) => <span className="font-medium text-foreground">{o.orderNumber}</span> },
    { key: "customer", header: "Client", render: (o) => o.customerName },
    { key: "date", header: "Date", render: (o) => formatDate(o.createdAt) },
    { key: "total", header: "Total", render: (o) => formatPrice(o.total, o.currency) },
    { key: "status", header: "Statut", render: (o) => <StatusBadge status={o.status} /> },
  ];

  return (
    <div className="space-y-6">
      <Seo title="Mes commandes" noIndex />
      <PageHeader title="Commandes" description="Commandes contenant vos produits." />

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Numéro, client…" className="max-w-sm" />

      <DataTable columns={columns} data={data?.items ?? []} rowKey={(o) => o.id} isLoading={isLoading} />

      {data && <PaginationControl pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
