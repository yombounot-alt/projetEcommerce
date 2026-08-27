import { mockBrands, mockCategories } from "./categories";
import type { Product } from "@/types/product.types";

/** PRNG déterministe (mulberry32) pour générer un jeu de données mock stable entre les rendus. */
function createRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(42);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const randFloat = (min: number, max: number, decimals = 2) => {
  const value = rng() * (max - min) + min;
  return Number(value.toFixed(decimals));
};

const productNamesByCategory: Record<string, string[]> = {
  electronics: [
    "Casque audio sans fil",
    "Enceinte Bluetooth portable",
    "Smartphone 5G",
    "Montre connectée",
    "Ordinateur portable ultrabook",
    "Tablette tactile 11 pouces",
    "Chargeur secteur rapide",
    "Webcam Full HD",
    "Clavier mécanique",
    "Souris sans fil ergonomique",
    "Barre de son compacte",
    "Disque SSD externe 1To",
  ],
  fashion: [
    "Veste en laine mélangée",
    "Chemise en coton bio",
    "Jean coupe droite",
    "Baskets running",
    "Sac à dos urbain",
    "Ceinture en cuir",
    "Pull col rond",
    "Manteau d'hiver",
    "Robe fluide",
    "Écharpe en cachemire",
    "Chaussures de ville",
    "Casquette en toile",
  ],
  home: [
    "Canapé 3 places",
    "Table basse en chêne",
    "Lampe de bureau LED",
    "Set de rangement modulable",
    "Coussin décoratif",
    "Tapis en laine tissée",
    "Service de vaisselle 24 pièces",
    "Miroir mural rond",
    "Bougie parfumée artisanale",
    "Étagère murale design",
    "Plaid en coton doux",
    "Vase en céramique",
  ],
  beauty: [
    "Crème hydratante visage",
    "Sérum vitamine C",
    "Coffret soins corps",
    "Parfum eau de toilette",
    "Palette de maquillage",
    "Shampoing sans sulfate",
    "Huile essentielle relaxante",
    "Baume à lèvres nourrissant",
    "Kit pinceaux maquillage",
    "Masque hydratant en tissu",
  ],
  sports: [
    "Tapis de yoga antidérapant",
    "Haltères ajustables",
    "Vélo de route aluminium",
    "Sac de sport imperméable",
    "Montre GPS running",
    "Ballon de football officiel",
    "Corde à sauter lestée",
    "Chaussures de trail",
    "Gourde isotherme 1L",
    "Tente de randonnée 2 places",
  ],
  toys: [
    "Jeu de construction créatif",
    "Peluche géante",
    "Puzzle 1000 pièces",
    "Circuit de voitures télécommandées",
    "Poupée articulée",
    "Jeu de société familial",
    "Trottinette enfant",
    "Kit scientifique éducatif",
  ],
  grocery: [
    "Coffret café gourmet",
    "Huile d'olive extra vierge",
    "Sélection de thés fins",
    "Chocolat noir artisanal",
    "Miel de fleurs sauvages",
    "Assortiment de biscuits",
    "Confiture artisanale",
    "Épices du monde en coffret",
  ],
  books: [
    "Roman contemporain",
    "Carnet de notes en cuir",
    "Stylo plume édition limitée",
    "Guide de voyage illustré",
    "Agenda annuel relié",
    "Livre de cuisine gastronomique",
    "Set de calligraphie",
    "Bande dessinée collector",
  ],
};

const adjectives = ["Premium", "Édition Limitée", "Pro", "Essentiel", "Classic", "Signature", "Urban", "Nature"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateProducts(): Product[] {
  const products: Product[] = [];
  let counter = 1;

  for (const category of mockCategories) {
    const names = productNamesByCategory[category.slug] ?? [];
    for (const baseName of names) {
      const useAdjective = rng() > 0.4;
      const name = useAdjective ? `${baseName} ${pick(adjectives)}` : baseName;
      const brand = pick(mockBrands);
      const price = randFloat(14.99, 899.99);
      const hasDiscount = rng() > 0.65;
      const compareAtPrice = hasDiscount ? Number((price * randFloat(1.15, 1.5)).toFixed(2)) : undefined;
      const stock = rng() > 0.12 ? randInt(0, 250) : 0;
      const reviewCount = randInt(0, 480);
      const id = `prod-${counter.toString().padStart(4, "0")}`;
      const slug = `${slugify(name)}-${counter}`;
      const imageSeed = `${category.slug}-${counter}`;

      products.push({
        id,
        sku: `SKU-${category.slug.slice(0, 3).toUpperCase()}-${counter.toString().padStart(4, "0")}`,
        name,
        slug,
        description:
          `${name} de la marque ${brand.name}. Conçu pour allier qualité, durabilité et style, ` +
          `ce produit s'intègre parfaitement dans la catégorie ${category.name.toLowerCase()}. ` +
          `Fabriqué avec des matériaux sélectionnés et testé pour garantir une expérience premium au quotidien.`,
        shortDescription: `${name} — qualité premium signée ${brand.name}.`,
        price,
        compareAtPrice,
        currency: "GNF",
        images: [
          `https://picsum.photos/seed/${imageSeed}-1/800/800`,
          `https://picsum.photos/seed/${imageSeed}-2/800/800`,
          `https://picsum.photos/seed/${imageSeed}-3/800/800`,
        ],
        categoryId: category.id,
        category: { id: category.id, name: category.name, slug: category.slug },
        brand: { id: brand.id, name: brand.name, slug: brand.slug },
        stock,
        weightKg: randFloat(0.1, 12, 2),
        dimensions: {
          width: randInt(5, 120),
          height: randInt(5, 120),
          depth: randInt(5, 120),
          unit: "cm",
        },
        status: rng() > 0.08 ? "published" : "draft",
        rating: reviewCount > 0 ? randFloat(3.2, 5, 1) : 0,
        reviewCount,
        tags: [category.slug, brand.slug],
        isFeatured: rng() > 0.82,
        isNew: rng() > 0.78,
        createdAt: new Date(Date.now() - randInt(1, 400) * 86_400_000).toISOString(),
        updatedAt: new Date(Date.now() - randInt(0, 30) * 86_400_000).toISOString(),
      });

      counter += 1;
    }
  }

  return products;
}

export const mockProducts: Product[] = generateProducts();

for (const category of mockCategories) {
  category.productCount = mockProducts.filter((p) => p.categoryId === category.id).length;
}

export function getProductBySlug(slug: string): Product | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return mockProducts
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, limit);
}
