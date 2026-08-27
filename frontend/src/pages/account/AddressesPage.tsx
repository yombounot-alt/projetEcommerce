import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinIcon, PlusIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ROUTES } from "@/constants/routes.constants";
import { addressFormSchema, type AddressFormValues } from "@/schemas/profile.schema";
import type { Address } from "@/types/user.types";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: "", fullName: "", line1: "", city: "", postalCode: "", country: "France", phone: "", isDefault: false,
    },
  });

  function onSubmit(values: AddressFormValues) {
    const newAddress: Address = { id: `addr-${Date.now()}`, ...values };
    setAddresses((prev) => (values.isDefault ? [...prev.map((a) => ({ ...a, isDefault: false })), newAddress] : [...prev, newAddress]));
    toast.success("Adresse ajoutée avec succès.");
    setIsDialogOpen(false);
    form.reset();
  }

  function handleDelete(id: string) {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success("Adresse supprimée.");
  }

  return (
    <div className="container-page py-10">
      <Seo title="Mes adresses" canonicalPath={ROUTES.addresses} noIndex />
      <PageHeader
        title="Mes adresses"
        description="Gérez vos adresses de livraison et de facturation."
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusIcon /> Ajouter une adresse</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle adresse</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <FormField control={form.control} name="label" render={({ field }) => (
                    <FormItem><FormLabel>Libellé</FormLabel><FormControl><Input placeholder="Domicile, Bureau…" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="line1" render={({ field }) => (
                    <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="postalCode" render={({ field }) => (
                      <FormItem><FormLabel>Code postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>Ville</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Pays</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="submit">Enregistrer</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {addresses.length === 0 ? (
        <EmptyState icon={MapPinIcon} title="Aucune adresse enregistrée" description="Ajoutez une adresse pour accélérer vos prochaines commandes." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{address.label}</p>
                  {address.isDefault && <Badge variant="secondary"><StarIcon className="size-3" /> Par défaut</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{address.fullName}</p>
                <p className="text-sm text-muted-foreground">{address.line1}</p>
                <p className="text-sm text-muted-foreground">{address.postalCode} {address.city}, {address.country}</p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                      <Trash2Icon className="size-4" /> Supprimer
                    </Button>
                  }
                  title="Supprimer cette adresse ?"
                  description="Cette action est irréversible."
                  destructive
                  onConfirm={() => handleDelete(address.id)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
