import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { z } from "zod";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/routes.constants";
import { useCategoriesQuery } from "@/features/categories/api/useCategoriesQuery";
import { productFormSchema, type ProductFormValues } from "@/schemas/product.schema";
import { mockProducts } from "@/mocks/products";

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { data: categories } = useCategoriesQuery();

  const existingProduct = isEditing ? mockProducts.find((p) => p.id === id) : undefined;

  const form = useForm<z.input<typeof productFormSchema>, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "", description: "", shortDescription: "", sku: "", price: 0, categoryId: "",
      stock: 0, images: [""], status: "draft",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images" as never,
  });

  useEffect(() => {
    if (existingProduct) {
      form.reset({
        name: existingProduct.name,
        description: existingProduct.description,
        shortDescription: existingProduct.shortDescription,
        sku: existingProduct.sku,
        price: existingProduct.price,
        compareAtPrice: existingProduct.compareAtPrice,
        categoryId: existingProduct.categoryId,
        brandId: existingProduct.brand?.id,
        stock: existingProduct.stock,
        weightKg: existingProduct.weightKg,
        images: existingProduct.images,
        status: existingProduct.status,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProduct?.id]);

  function onSubmit() {
    toast.success(isEditing ? "Produit mis à jour avec succès." : "Produit créé avec succès.");
    navigate(ROUTES.admin.products);
  }

  return (
    <div className="space-y-6">
      <Seo title={isEditing ? "Modifier le produit" : "Nouveau produit"} noIndex />
      <Breadcrumb items={[{ label: "Produits", to: ROUTES.admin.products }, { label: isEditing ? "Modifier" : "Nouveau" }]} />
      <PageHeader title={isEditing ? "Modifier le produit" : "Nouveau produit"} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 p-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nom du produit</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="shortDescription" render={({ field }) => (
                  <FormItem><FormLabel>Description courte</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <FormLabel>Images (URLs)</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField control={form.control} name={`images.${index}`} render={({ field: imageField }) => (
                      <FormItem className="flex-1">
                        <FormControl><Input placeholder="https://…" {...imageField} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append("")}>
                  <PlusIcon className="size-4" /> Ajouter une image
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 p-6">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem><FormLabel>SKU</FormLabel><FormControl><Input placeholder="SKU-EXAMPLE-001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Prix (€)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={String(field.value ?? "")} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="compareAtPrice" render={({ field }) => (
                    <FormItem><FormLabel>Prix barré (€)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={String(field.value ?? "")} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="stock" render={({ field }) => (
                    <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} value={String(field.value ?? "")} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="weightKg" render={({ field }) => (
                    <FormItem><FormLabel>Poids (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={String(field.value ?? "")} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(ROUTES.admin.products)}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1">{isEditing ? "Enregistrer" : "Créer le produit"}</Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
