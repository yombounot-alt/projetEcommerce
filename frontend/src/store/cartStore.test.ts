import { beforeEach, describe, expect, it } from "vitest";
import { selectCartCount, selectCartSubtotal, useCartStore } from "./cartStore";

const sampleItem = {
  productId: "prod-1",
  name: "Produit test",
  slug: "produit-test",
  image: "https://example.com/image.jpg",
  price: 10,
  quantity: 1,
  stock: 5,
};

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false });
});

describe("cartStore", () => {
  it("ajoute un nouvel article au panier", () => {
    useCartStore.getState().addItem(sampleItem);
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("cumule la quantité si l'article existe déjà, sans dépasser le stock", () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().addItem({ ...sampleItem, quantity: 10 });
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("supprime un article du panier", () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().removeItem(sampleItem.productId);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("calcule correctement le sous-total et le nombre d'articles", () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().addItem({ ...sampleItem, productId: "prod-2", quantity: 2 });
    expect(selectCartSubtotal(useCartStore.getState())).toBe(30);
    expect(selectCartCount(useCartStore.getState())).toBe(3);
  });

  it("vide le panier", () => {
    useCartStore.getState().addItem(sampleItem);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  describe("gestion des variantes", () => {
    const variantA = { ...sampleItem, variantId: "var-a", variantLabel: "S / Rouge", stock: 5 };
    const variantB = { ...sampleItem, variantId: "var-b", variantLabel: "M / Bleu", stock: 3 };

    it("traite deux variantes du même produit comme deux lignes distinctes", () => {
      useCartStore.getState().addItem(variantA);
      useCartStore.getState().addItem(variantB);
      expect(useCartStore.getState().items).toHaveLength(2);
    });

    it("cumule la quantité uniquement sur la même variante, pas sur les autres variantes du produit", () => {
      useCartStore.getState().addItem(variantA);
      useCartStore.getState().addItem(variantB);
      useCartStore.getState().addItem({ ...variantA, quantity: 2 });

      const items = useCartStore.getState().items;
      expect(items.find((i) => i.variantId === "var-a")?.quantity).toBe(3);
      expect(items.find((i) => i.variantId === "var-b")?.quantity).toBe(1);
    });

    it("ne confond pas un produit sans variante avec une variante du même productId", () => {
      useCartStore.getState().addItem(sampleItem); // sans variantId
      useCartStore.getState().addItem(variantA);
      expect(useCartStore.getState().items).toHaveLength(2);
    });

    it("supprime uniquement la variante ciblée", () => {
      useCartStore.getState().addItem(variantA);
      useCartStore.getState().addItem(variantB);
      useCartStore.getState().removeItem(variantA.productId, variantA.variantId);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].variantId).toBe("var-b");
    });

    it("met à jour la quantité de la bonne variante et respecte son propre stock", () => {
      useCartStore.getState().addItem(variantA);
      useCartStore.getState().addItem(variantB);
      useCartStore.getState().updateQuantity(variantA.productId, 99, variantA.variantId);

      const items = useCartStore.getState().items;
      expect(items.find((i) => i.variantId === "var-a")?.quantity).toBe(5); // plafonné à son stock
      expect(items.find((i) => i.variantId === "var-b")?.quantity).toBe(1); // inchangé
    });

    it("une quantité à zéro supprime la ligne de la variante ciblée", () => {
      useCartStore.getState().addItem(variantA);
      useCartStore.getState().addItem(variantB);
      useCartStore.getState().updateQuantity(variantA.productId, 0, variantA.variantId);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].variantId).toBe("var-b");
    });
  });
});
