import { PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControl } from "@/components/common/PaginationControl";
import { SearchBar } from "@/components/common/SearchBar";
import { Seo } from "@/components/common/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProductsQuery } from "@/features/products/api/useProductsQuery";
import { formatPrice } from "@/utils/format";
import type { ProductListItem } from "@/types/product.types";

export default function SellerProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProductsQuery({ search, page, pageSize: 10 });

  const columns: DataTableColumn<ProductListItem>[] = [
    {
      key: "product",
      header: "Produit",
      render: (product) => (
        <div className="flex items-center gap-3">
          <img src={product.images[0]} alt={product.name} className="size-10 rounded-md object-cover" />
          <p className="font-medium text-foreground">{product.name}</p>
        </div>
      ),
    },
    { key: "price", header: "Prix", render: (p) => formatPrice(p.price, p.currency) },
    {
      key: "stock",
      header: "Stock",
      render: (p) => <Badge variant={p.stock === 0 ? "destructive" : p.stock < 10 ? "warning" : "success"}>{p.stock}</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (product) => (
        <Button variant="ghost" size="icon" className="size-8" onClick={() => toast.info(`Édition de ${product.name} (démo)`)}>
          <PencilIcon className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Seo title="Mes produits" noIndex />
      <PageHeader
        title="Mes produits"
        description="Gérez les produits que vous proposez à la vente."
        actions={<Button onClick={() => toast.info("Ajout de produit (démo)")}><PlusIcon /> Ajouter un produit</Button>}
      />

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Rechercher…" className="max-w-sm" />

      <DataTable columns={columns} data={data?.items ?? []} rowKey={(p) => p.id} isLoading={isLoading} />

      {data && <PaginationControl pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
