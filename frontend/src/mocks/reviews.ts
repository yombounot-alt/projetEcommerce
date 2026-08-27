import { mockProducts } from "./products";
import type { ProductReview } from "@/types/product.types";

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
const rng = createRng(321);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

const reviewers = [
  "Julien D.", "Amandine R.", "Karim B.", "Sophie M.", "Thomas L.",
  "Fatou N.", "Pierre G.", "Laura V.", "Antoine C.", "Nadia S.",
];

const titles = [
  "Très satisfait de mon achat",
  "Conforme à la description",
  "Qualité au rendez-vous",
  "Bon rapport qualité-prix",
  "Livraison rapide, produit impeccable",
  "Un peu déçu sur la finition",
  "Je recommande vivement",
  "Correct sans plus",
];

const comments = [
  "Le produit correspond exactement à mes attentes, je referai un achat sans hésiter.",
  "Livraison rapide et emballage soigné. La qualité est vraiment au rendez-vous.",
  "Bon produit dans l'ensemble, quelques petits détails à améliorer mais rien de bloquant.",
  "Utilisation quotidienne depuis plusieurs semaines, aucun souci à signaler pour le moment.",
  "Le rapport qualité-prix est excellent comparé à d'autres produits similaires testés.",
  "Un service client réactif et un produit qui tient ses promesses.",
];

function generateReviews(): ProductReview[] {
  const reviews: ProductReview[] = [];

  for (const product of mockProducts) {
    if (product.reviewCount === 0) continue;
    const sampleSize = Math.min(product.reviewCount, randInt(2, 6));

    for (let i = 0; i < sampleSize; i += 1) {
      reviews.push({
        id: `review-${product.id}-${i}`,
        productId: product.id,
        authorName: pick(reviewers),
        authorAvatarUrl: `https://i.pravatar.cc/100?u=${product.id}-${i}`,
        rating: randInt(3, 5),
        title: pick(titles),
        comment: pick(comments),
        createdAt: new Date(Date.now() - randInt(1, 300) * 86_400_000).toISOString(),
        verifiedPurchase: rng() > 0.3,
      });
    }
  }

  return reviews;
}

export const mockReviews: ProductReview[] = generateReviews();

export function getReviewsByProduct(productId: string): ProductReview[] {
  return mockReviews.filter((r) => r.productId === productId);
}
