import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { PaginationControl } from "@/components/common/PaginationControl";
import { Seo } from "@/components/common/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useCreateCouponMutation,
  useDeleteCouponMutation,
  useUpdateCouponMutation,
} from "@/features/coupons/api/useCouponMutations";
import { useCouponsQuery } from "@/features/coupons/api/useCouponsQuery";
import { couponFormSchema, type CouponFormValues } from "@/schemas/coupon.schema";
import { formatPrice } from "@/utils/format";
import type { Coupon } from "@/types/coupon.types";

const DEFAULT_VALUES: z.input<typeof couponFormSchema> = {
  code: "",
  type: "percentage",
  value: 10,
  minSubtotal: undefined,
  maxUses: undefined,
  isActive: true,
  expiresAt: "",
};

export default function AdminCouponsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCouponsQuery({ page, pageSize: 10 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const createCoupon = useCreateCouponMutation();
  const updateCoupon = useUpdateCouponMutation();
  const deleteCoupon = useDeleteCouponMutation();
  const isSubmitting = createCoupon.isPending || updateCoupon.isPending;

  const form = useForm<z.input<typeof couponFormSchema>, unknown, CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  function openCreateDialog() {
    setEditingCoupon(null);
    form.reset(DEFAULT_VALUES);
    setIsDialogOpen(true);
  }

  function openEditDialog(coupon: Coupon) {
    setEditingCoupon(coupon);
    form.reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minSubtotal: coupon.minSubtotal,
      maxUses: coupon.maxUses,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
    });
    setIsDialogOpen(true);
  }

  function onSubmit(values: CouponFormValues) {
    const payload = {
      ...values,
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
    };
    const onSuccess = () => {
      toast.success(editingCoupon ? "Coupon mis à jour avec succès." : "Coupon créé avec succès.");
      setIsDialogOpen(false);
      form.reset();
    };
    const onError = () => {
      toast.error(
        editingCoupon
          ? "Impossible de mettre à jour ce coupon."
          : "Impossible de créer ce coupon (code déjà utilisé ?).",
      );
    };

    if (editingCoupon) {
      updateCoupon.mutate({ id: editingCoupon.id, changes: payload }, { onSuccess, onError });
    } else {
      createCoupon.mutate(payload, { onSuccess, onError });
    }
  }

  function handleDelete(coupon: Coupon) {
    deleteCoupon.mutate(coupon.id, {
      onSuccess: () => toast.success("Coupon supprimé."),
      onError: () => toast.error("Impossible de supprimer ce coupon."),
    });
  }

  const columns: DataTableColumn<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      render: (c) => <span className="font-mono font-medium text-foreground">{c.code}</span>,
    },
    {
      key: "value",
      header: "Réduction",
      render: (c) => (c.type === "percentage" ? `${c.value}%` : formatPrice(c.value, "GNF")),
    },
    {
      key: "usage",
      header: "Utilisations",
      render: (c) => (c.maxUses ? `${c.usedCount} / ${c.maxUses}` : `${c.usedCount} (illimité)`),
    },
    {
      key: "status",
      header: "Statut",
      render: (c) => (
        <Badge variant={c.isActive ? "success" : "outline"}>
          {c.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (coupon) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Modifier"
            onClick={() => openEditDialog(coupon)}
          >
            <PencilIcon className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label="Supprimer"
              >
                <Trash2Icon className="size-4" />
              </Button>
            }
            title="Supprimer ce coupon ?"
            description={`Le code « ${coupon.code} » ne pourra plus être utilisé.`}
            destructive
            onConfirm={() => handleDelete(coupon)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Seo title="Gestion des coupons" noIndex />
      <PageHeader
        title="Coupons"
        description="Créez et gérez les codes promotionnels de la boutique."
        actions={
          <Button onClick={openCreateDialog}>
            <PlusIcon /> Nouveau coupon
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Modifier le coupon" : "Nouveau coupon"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: WELCOME10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Pourcentage</SelectItem>
                          <SelectItem value="fixed">Montant fixe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valeur</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={String(field.value ?? "")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="minSubtotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sous-total minimum</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Optionnel"
                          {...field}
                          value={String(field.value ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre d'utilisations max</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Illimité"
                          {...field}
                          value={String(field.value ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'expiration</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border border-input p-3">
                    <FormLabel className="font-normal">Coupon actif</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
      />

      {data && <PaginationControl pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
