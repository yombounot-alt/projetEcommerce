import { Brand } from "../models/Brand";
import { ConflictError, NotFoundError } from "../utils/AppError";
import { slugify } from "../utils/slugify";

export async function listBrands() {
  return Brand.find().sort({ name: 1 });
}

export async function getBrandBySlug(slug: string) {
  return Brand.findOne({ slug });
}

interface BrandInput {
  name: string;
  slug?: string;
  logoUrl?: string;
}

export async function createBrand(input: BrandInput) {
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);
  const existing = await Brand.findOne({ slug });
  if (existing) {
    throw new ConflictError("Une marque avec ce slug existe déjà", "SLUG_TAKEN");
  }
  return Brand.create({ ...input, slug });
}

export async function deleteBrand(id: string) {
  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) {
    throw new NotFoundError("Marque introuvable", "BRAND_NOT_FOUND");
  }
}
