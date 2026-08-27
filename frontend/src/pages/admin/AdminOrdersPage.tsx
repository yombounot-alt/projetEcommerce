import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControl } from "@/components/common/PaginationControl";
import { SearchBar } from "@/components/common/SearchBar";
import { Seo } from "@/components/common/Seo";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROUTES } from "@/constants/routes.constants";
import { useOrdersQuery } from "@/features/orders/api/useOrdersQuery";
import { ORDER_STATUS_OPTIONS } from "@/utils/order";
import { formatDate, formatPrice } from "@/utils/format";
import type { Order, OrderStatus } from "@/types/order.types";

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrdersQuery({
    search, status: status === "all" ? undefined : status, page, pageSize: 10,
  });

  const columns: DataTableColumn<Order>[] = [
    { key: "orderNumber", header: "Commande", render: (o) => <span className="font-medium text-foreground">{o.orderNumber}</span> },
    { key: "customer", header: "Client", render: (o) => o.customerName },
    { key: "date", header: "Date", render: (o) => formatDate(o.createdAt) },
    { key: "total", header: "Total", render: (o) => formatPrice(o.total, o.currency) },
    { key: "status", header: "Statut", render: (o) => <StatusBadge status={o.status} /> },
  ];

  return (
    <div className="space-y-6">
      <Seo title="Gestion des commandes" noIndex />
      <PageHeader title="Commandes" description="Suivez et gérez l'ensemble des commandes de la plateforme." />

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Numéro, client, email…" className="max-w-sm" />
        <Select value={status} onValueChange={(v) => { setStatus(v as OrderStatus | "all"); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="cursor-pointer [&_tr]:cursor-pointer" onClick={(e) => {
        const row = (e.target as HTMLElement).closest("[data-row-id]");
        const orderId = row?.getAttribute("data-row-id");
        if (orderId) navigate(ROUTES.admin.orderDetails(orderId));
      }}>
        <DataTable
          columns={columns.map((col) => ({
            ...col,
            render: (order: Order) => <div data-row-id={order.id}>{col.render(order)}</div>,
          }))}
          data={data?.items ?? []}
          rowKey={(o) => o.id}
          isLoading={isLoading}
        />
      </div>

      {data && <PaginationControl pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
