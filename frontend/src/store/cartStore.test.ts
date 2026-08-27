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
});
