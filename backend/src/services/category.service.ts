import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { ConflictError, NotFoundError } from "../utils/AppError";
import { slugify } from "../utils/slugify";

export async function listCategories(activeOnly = true) {
  const filter = activeOnly ? { isActive: true } : {};
  const categories = await Category.find(filter).sort({ name: 1 }).lean();
  const counts = await Product.aggregate<{ _id: string; count: number }>([
    { $match: { status: "published" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  return categories.map((category) => ({
    ...category,
    id: String(category._id),
    productCount: countMap.get(String(category._id)) ?? 0,
  }));
}

export async function getCategoryBySlug(slug: string) {
  const category = await Category.findOne({ slug }).lean();
  if (!category) return null;
  const productCount = await Product.countDocuments({
    category: category._id,
    status: "published",
  });
  return { ...category, id: String(category._id), productCount };
}

interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
}

export async function createCategory(input: CategoryInput) {
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);
  const existing = await Category.findOne({ slug });
  if (existing) {
    throw new ConflictError("Une catégorie avec ce slug existe déjà", "SLUG_TAKEN");
  }
  return Category.create({ ...input, slug });
}

export async function updateCategory(
  id: string,
  changes: Partial<CategoryInput> & { isActive?: boolean },
) {
  if (changes.slug) {
    changes.slug = slugify(changes.slug);
    const existing = await Category.findOne({ slug: changes.slug, _id: { $ne: id } });
    if (existing) {
      throw new ConflictError("Une catégorie avec ce slug existe déjà", "SLUG_TAKEN");
    }
  }
  const category = await Category.findByIdAndUpdate(id, changes, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    throw new NotFoundError("Catégorie introuvable", "CATEGORY_NOT_FOUND");
  }
  return category;
}

export async function deleteCategory(id: string) {
  const inUse = await Product.exists({ category: id });
  if (inUse) {
    throw new ConflictError("Impossible de supprimer une catégorie contenant encore des produits", "CATEGORY_IN_USE");
  }
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new NotFoundError("Catégorie introuvable", "CATEGORY_NOT_FOUND");
  }
}
