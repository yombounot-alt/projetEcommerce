import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { ROUTES } from "@/constants/routes.constants";
import { useCategoriesQuery } from "@/features/categories/api/useCategoriesQuery";
import { useProductByIdQuery } from "@/features/products/api/useProductByIdQuery";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/features/products/api/useProductMutations";
import { ProductForm } from "@/features/products/components/ProductForm";
import type { ProductFormValues } from "@/schemas/product.schema";

export default function SellerProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { data: categories } = useCategoriesQuery();
  const { data: existingProduct } = useProductByIdQuery(id);
  const createProduct = useCreateProductMutation();
  const updateProduct = useUpdateProductMutation();
  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  function onSubmit(values: ProductFormValues) {
    const onSuccess = () => {
      toast.success(isEditing ? "Produit mis à jour avec succès." : "Produit créé avec succès.");
      navigate(ROUTES.seller.products);
    };
    const onError = () => {
      toast.error(
        isEditing ? "Impossible de mettre à jour ce produit." : "Impossible de créer ce produit.",
      );
    };

    if (isEditing && id) {
      const { sku: _sku, ...changes } = values;
      updateProduct.mutate({ id, changes }, { onSuccess, onError });
    } else {
      createProduct.mutate(values, { onSuccess, onError });
    }
  }

  return (
    <div className="space-y-6">
      <Seo title={isEditing ? "Modifier le produit" : "Nouveau produit"} noIndex />
      <Breadcrumb
        items={[
          { label: "Mes produits", to: ROUTES.seller.products },
          { label: isEditing ? "Modifier" : "Nouveau" },
        ]}
      />
      <PageHeader title={isEditing ? "Modifier le produit" : "Nouveau produit"} />

      <ProductForm
        existingProduct={existingProduct}
        categories={categories}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        onCancel={() => navigate(ROUTES.seller.products)}
      />
    </div>
  );
}
