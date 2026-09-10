import { Review, type IReview } from "../models/Review";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/AppError";

interface PopulatedAuthor {
  _id: unknown;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

function toReviewDTO(review: IReview) {
  const author = review.author as unknown as PopulatedAuthor;
  return {
    id: String(review._id),
    productId: String(review.product),
    authorId: String(author._id),
    authorName: `${author.firstName} ${author.lastName}`,
    authorAvatarUrl: author.avatarUrl,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    createdAt: review.createdAt,
    verifiedPurchase: review.verifiedPurchase,
  };
}

async function recalculateProductRating(productId: string): Promise<void> {
  const stats = await Review.aggregate<{ _id: null; avgRating: number; count: number }>([
    { $match: { product: productId } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const { avgRating = 0, count = 0 } = stats[0] ?? {};
  await Product.updateOne(
    { _id: productId },
    { rating: Number(avgRating.toFixed(2)), reviewCount: count },
  );
}

export async function listProductReviews(productId: string) {
  const reviews = await Review.find({ product: productId })
    .populate("author", "firstName lastName avatarUrl")
    .sort({ createdAt: -1 });

  return reviews.map(toReviewDTO);
}

interface CreateReviewInput {
  rating: number;
  title: string;
  comment: string;
}

export async function createReview(productId: string, authorId: string, input: CreateReviewInput) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError("Produit introuvable", "PRODUCT_NOT_FOUND");
  }

  const existing = await Review.findOne({ product: productId, author: authorId });
  if (existing) {
    throw new ConflictError("Vous avez déjà laissé un avis sur ce produit", "REVIEW_ALREADY_EXISTS");
  }

  // A verified purchase means this customer has a delivered order containing this product —
  // real reviews are prioritized without hard-blocking honest feedback from non-buyers.
  const purchaseOrder = await Order.findOne({
    customer: authorId,
    status: "delivered",
    "items.product": productId,
  }).select("_id");

  const review = await Review.create({
    product: productId,
    author: authorId,
    order: purchaseOrder?._id,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    verifiedPurchase: Boolean(purchaseOrder),
  });
  await review.populate("author", "firstName lastName avatarUrl");

  await recalculateProductRating(productId);
  return toReviewDTO(review);
}

export async function updateReview(
  reviewId: string,
  authorId: string,
  changes: Partial<CreateReviewInput>,
) {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new NotFoundError("Avis introuvable", "REVIEW_NOT_FOUND");
  }
  if (String(review.author) !== authorId) {
    throw new ForbiddenError("Vous ne pouvez modifier que vos propres avis", "NOT_REVIEW_OWNER");
  }

  Object.assign(review, changes);
  await review.save();
  await review.populate("author", "firstName lastName avatarUrl");
  await recalculateProductRating(String(review.product));
  return toReviewDTO(review);
}

export async function deleteReview(reviewId: string, actorId: string, isAdmin: boolean) {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new NotFoundError("Avis introuvable", "REVIEW_NOT_FOUND");
  }
  if (!isAdmin && String(review.author) !== actorId) {
    throw new ForbiddenError("Vous ne pouvez supprimer que vos propres avis", "NOT_REVIEW_OWNER");
  }

  const productId = String(review.product);
  await review.deleteOne();
  await recalculateProductRating(productId);
}
