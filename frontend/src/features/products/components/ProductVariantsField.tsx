import { PlusIcon, Trash2Icon, WandSparklesIcon } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { productVariantFormSchema, variantOptionFormSchema } from "@/schemas/product.schema";

// Uses the form's *input* shape (pre-coercion) so this slots directly into a react-hook-form
// field whose numeric values are `unknown` until zod coerces them on submit — matches the
// z.input<...>/z.output<...> split used by the surrounding ProductForm (see its useForm call).
type VariantOptionValue = z.input<typeof variantOptionFormSchema>;
type VariantValue = z.input<typeof productVariantFormSchema>;

interface ProductVariantsFieldProps {
  variantOptions: VariantOptionValue[];
  variants: VariantValue[];
  onChange: (next: { variantOptions: VariantOptionValue[]; variants: VariantValue[] }) => void;
}

/** Local editing shape for an option group — values kept as free text until "Générer" parses them. */
interface OptionDraft {
  name: string;
  valuesText: string;
}

function attributesKey(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

function cartesianProduct(groups: { name: string; values: string[] }[]): Record<string, string>[] {
  return groups.reduce<Record<string, string>[]>(
    (acc, group) =>
      acc.flatMap((combo) => group.values.map((value) => ({ ...combo, [group.name]: value }))),
    [{}],
  );
}

export function ProductVariantsField({
  variantOptions,
  variants,
  onChange,
}: ProductVariantsFieldProps) {
  const [enabled, setEnabled] = useState(variantOptions.length > 0);
  const [drafts, setDrafts] = useState<OptionDraft[]>(
    variantOptions.length > 0
      ? variantOptions.map((o) => ({ name: o.name, valuesText: o.values.join(", ") }))
      : [{ name: "", valuesText: "" }],
  );

  function updateDraft(index: number, changes: Partial<OptionDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...changes } : d)));
  }

  function addOptionGroup() {
    setDrafts((prev) => [...prev, { name: "", valuesText: "" }]);
  }

  function removeOptionGroup(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function generateVariants() {
    const groups = drafts
      .map((d) => ({
        name: d.name.trim(),
        values: d.valuesText
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((g) => g.name && g.values.length > 0);

    if (groups.length === 0) {
      onChange({ variantOptions: [], variants: [] });
      return;
    }

    const combos = cartesianProduct(groups);
    const existingByKey = new Map(variants.map((v) => [attributesKey(v.attributes), v]));

    const nextVariants: VariantValue[] = combos.map((attributes) => {
      const existing = existingByKey.get(attributesKey(attributes));
      if (existing) return existing;
      const slug = Object.values(attributes)
        .join("-")
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "");
      return {
        sku: `VAR-${slug}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        attributes,
        availableStock: 0,
      };
    });

    onChange({ variantOptions: groups, variants: nextVariants });
  }

  function updateVariantRow(index: number, changes: Partial<VariantValue>) {
    const next = variants.map((v, i) => (i === index ? { ...v, ...changes } : v));
    onChange({ variantOptions, variants: next });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Ce produit a des variantes</Label>
          <p className="text-xs text-muted-foreground">
            Taille, couleur… avec stock et prix propres à chaque combinaison.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => {
            setEnabled(checked);
            if (!checked) onChange({ variantOptions: [], variants: [] });
          }}
        />
      </div>

      {enabled && (
        <>
          <Separator />
          <div className="space-y-3">
            {drafts.map((draft, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Nom de l'option</Label>
                  <Input
                    placeholder="ex: Taille"
                    value={draft.name}
                    onChange={(e) => updateDraft(index, { name: e.target.value })}
                  />
                </div>
                <div className="flex-[2] space-y-1">
                  <Label className="text-xs">Valeurs (séparées par des virgules)</Label>
                  <Input
                    placeholder="ex: S, M, L"
                    value={draft.valuesText}
                    onChange={(e) => updateDraft(index, { valuesText: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Supprimer cette option"
                  onClick={() => removeOptionGroup(index)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addOptionGroup}>
                <PlusIcon className="size-4" /> Ajouter une option
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={generateVariants}>
                <WandSparklesIcon className="size-4" /> Générer les variantes
              </Button>
            </div>
          </div>

          {variants.length > 0 && (
            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {variants.length} variante{variants.length > 1 ? "s" : ""} — le stock affiché du
                produit est calculé automatiquement (somme des variantes).
              </p>
              {variants.map((variant, index) => (
                <div
                  key={variant.id ?? attributesKey(variant.attributes)}
                  className="grid grid-cols-[1fr_1fr_1fr_1fr] items-end gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {Object.values(variant.attributes).join(" / ")}
                    </Label>
                    <Input
                      placeholder="SKU"
                      value={variant.sku}
                      onChange={(e) => updateVariantRow(index, { sku: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Prix (optionnel)</Label>
                    <Input
                      type="number"
                      placeholder="Prix de base"
                      value={String(variant.price ?? "")}
                      onChange={(e) =>
                        updateVariantRow(index, {
                          price: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stock</Label>
                    <Input
                      type="number"
                      value={String(variant.availableStock ?? "")}
                      onChange={(e) =>
                        updateVariantRow(index, { availableStock: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Image (optionnel)</Label>
                    <Input
                      placeholder="URL"
                      value={variant.image ?? ""}
                      onChange={(e) => updateVariantRow(index, { image: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
