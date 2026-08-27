import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCategoriesQuery } from "@/features/categories/api/useCategoriesQuery";
import { categoryFormSchema, type CategoryFormValues } from "@/schemas/product.schema";
import type { Category } from "@/types/product.types";

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategoriesQuery();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", slug: "", description: "" },
  });

  function onSubmit() {
    toast.success("Catégorie enregistrée avec succès.");
    setIsDialogOpen(false);
    form.reset();
  }

  const columns: DataTableColumn<Category>[] = [
    { key: "name", header: "Nom", render: (c) => <span className="font-medium text-foreground">{c.name}</span> },
    { key: "slug", header: "Slug", render: (c) => c.slug },
    { key: "count", header: "Produits", render: (c) => c.productCount },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (category) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="size-8" aria-label="Modifier">
            <PencilIcon className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Supprimer">
                <Trash2Icon className="size-4" />
              </Button>
            }
            title="Supprimer cette catégorie ?"
            description={`« ${category.name} » sera définitivement supprimée.`}
            destructive
            onConfirm={() => toast.success("Catégorie supprimée.")}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Seo title="Gestion des catégories" noIndex />
      <PageHeader
        title="Catégories"
        description="Organisez la structure de votre catalogue produits."
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusIcon /> Nouvelle catégorie</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouvelle catégorie</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug</FormLabel><FormControl><Input placeholder="ex: electronique" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter><Button type="submit">Enregistrer</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable columns={columns} data={categories ?? []} rowKey={(c) => c.id} isLoading={isLoading} />
    </div>
  );
}
