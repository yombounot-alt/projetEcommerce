import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import type { productVariantFormSchema, variantOptionFormSchema } from "@/schemas/product.schema";
import { ProductVariantsField } from "./ProductVariantsField";

type VariantOptionValue = z.input<typeof variantOptionFormSchema>;
type VariantValue = z.input<typeof productVariantFormSchema>;

/** Harnais reproduisant la façon dont ProductForm possède l'état (controlled component) :
 *  permet de vérifier le comportement à travers plusieurs cycles onChange -> re-render. */
function Harness() {
  const [variantOptions, setVariantOptions] = useState<VariantOptionValue[]>([]);
  const [variants, setVariants] = useState<VariantValue[]>([]);

  return (
    <ProductVariantsField
      variantOptions={variantOptions}
      variants={variants}
      onChange={(next) => {
        setVariantOptions(next.variantOptions);
        setVariants(next.variants);
      }}
    />
  );
}

function enableVariants() {
  fireEvent.click(screen.getByRole("switch"));
}

function fillOptionGroup(optionName: string, valuesText: string, groupIndex = 0) {
  const nameInputs = screen.getAllByPlaceholderText("ex: Taille");
  const valuesInputs = screen.getAllByPlaceholderText("ex: S, M, L");
  fireEvent.change(nameInputs[groupIndex], { target: { value: optionName } });
  fireEvent.change(valuesInputs[groupIndex], { target: { value: valuesText } });
}

function clickGenerate() {
  fireEvent.click(screen.getByRole("button", { name: /Générer les variantes/i }));
}

describe("ProductVariantsField", () => {
  it("n'affiche pas le formulaire d'options tant que l'interrupteur est désactivé", () => {
    render(<Harness />);
    expect(screen.queryByPlaceholderText("ex: Taille")).not.toBeInTheDocument();
  });

  it("génère le produit cartésien pour une seule option", () => {
    render(<Harness />);
    enableVariants();
    fillOptionGroup("Taille", "S, M, L");
    clickGenerate();

    expect(screen.getByText(/3 variantes/)).toBeInTheDocument();
    // Chaque valeur doit apparaître comme libellé de ligne de variante.
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("L")).toBeInTheDocument();
  });

  it("génère le produit cartésien pour deux options (Taille x Couleur)", () => {
    render(<Harness />);
    enableVariants();
    fillOptionGroup("Taille", "S, M");
    fireEvent.click(screen.getByRole("button", { name: /Ajouter une option/i }));
    fillOptionGroup("Couleur", "Rouge, Bleu", 1);
    clickGenerate();

    // 2 x 2 = 4 combinaisons
    expect(screen.getByText(/4 variantes/)).toBeInTheDocument();
    expect(screen.getByText("S / Rouge")).toBeInTheDocument();
    expect(screen.getByText("S / Bleu")).toBeInTheDocument();
    expect(screen.getByText("M / Rouge")).toBeInTheDocument();
    expect(screen.getByText("M / Bleu")).toBeInTheDocument();
  });

  it("ignore les espaces superflus et les valeurs vides dans la liste séparée par des virgules", () => {
    render(<Harness />);
    enableVariants();
    fillOptionGroup("Taille", " S ,, M ,  ");
    clickGenerate();

    expect(screen.getByText(/2 variantes/)).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("préserve le SKU/prix/stock d'une variante existante lors d'une régénération", () => {
    render(<Harness />);
    enableVariants();
    fillOptionGroup("Taille", "S, M");
    clickGenerate();

    const rows = screen.getAllByPlaceholderText("SKU");
    expect(rows).toHaveLength(2);

    // Modifie le SKU de la variante "S" pour vérifier qu'il survit à une régénération.
    fireEvent.change(rows[0], { target: { value: "CUSTOM-SKU-S" } });

    // Ajoute la valeur "L" à la même option et régénère : S et M doivent garder leurs données,
    // seule L doit apparaître comme nouvelle ligne avec un SKU auto-généré.
    fillOptionGroup("Taille", "S, M, L");
    clickGenerate();

    expect(screen.getByText(/3 variantes/)).toBeInTheDocument();
    const skuInputsAfter = screen.getAllByPlaceholderText("SKU");
    expect(skuInputsAfter.map((el) => (el as HTMLInputElement).value)).toContain("CUSTOM-SKU-S");
  });

  it("efface toutes les variantes quand l'interrupteur est désactivé", () => {
    render(<Harness />);
    enableVariants();
    fillOptionGroup("Taille", "S, M");
    clickGenerate();
    expect(screen.getByText(/2 variantes/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch"));
    expect(screen.queryByText(/^\d+ variantes?/)).not.toBeInTheDocument();
  });

  it("ne génère rien si aucune option n'a de nom et de valeurs valides", () => {
    render(<Harness />);
    enableVariants();
    clickGenerate();
    expect(screen.queryByText(/^\d+ variantes?/)).not.toBeInTheDocument();
  });
});
