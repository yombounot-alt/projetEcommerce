import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControl } from "@/components/common/PaginationControl";
import { SearchBar } from "@/components/common/SearchBar";
import { Seo } from "@/components/common/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes.constants";
import { useProductsQuery } from "@/features/products/api/useProductsQuery";
import { formatPrice } from "@/utils/format";
import type { ProductListItem } from "@/types/product.types";

export default function AdminProductsPage() {
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
          <div>
            <p className="font-medium text-foreground">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.sku}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Catégorie", render: (p) => p.category.name },
    { key: "price", header: "Prix", render: (p) => formatPrice(p.price, p.currency) },
    {
      key: "stock",
      header: "Stock",
      render: (p) => (
        <Badge variant={p.stock === 0 ? "destructive" : p.stock < 10 ? "warning" : "success"}>
          {p.stock === 0 ? "Rupture" : `${p.stock} en stock`}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (p) => <Badge variant={p.status === "published" ? "success" : "outline"}>{p.status === "published" ? "Publié" : "Brouillon"}</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (product) => (
        <div className="flex justify-end gap-1">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link to={ROUTES.admin.productEdit(product.id)} aria-label="Modifier">
              <PencilIcon className="size-4" />
            </Link>
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Supprimer">
                <Trash2Icon className="size-4" />
              </Button>
            }
            title="Supprimer ce produit ?"
            description={`« ${product.name} » sera définitivement supprimé du catalogue.`}
            destructive
            onConfirm={() => toast.success("Produit supprimé.")}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Seo title="Gestion des produits" noIndex />
      <PageHeader
        title="Produits"
        description="Gérez le catalogue produits de la plateforme."
        actions={
          <Button asChild>
            <Link to={ROUTES.admin.productNew}><PlusIcon /> Nouveau produit</Link>
          </Button>
        }
      />

      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Rechercher un produit…" className="max-w-sm" />

      <DataTable columns={columns} data={data?.items ?? []} rowKey={(p) => p.id} isLoading={isLoading} />

      {data && <PaginationControl pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
