import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { NotFoundError } from "../utils/AppError";
import * as categoryService from "../services/category.service";
import * as brandService from "../services/brand.service";

export const list = catchAsync(async (req: Request, res: Response) => {
  const activeOnly = req.user?.role !== "admin";
  const categories = await categoryService.listCategories(activeOnly);
  res.status(200).json(categories);
});

export const getBySlug = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  if (!category) throw new NotFoundError("Catégorie introuvable", "CATEGORY_NOT_FOUND");
  res.status(200).json(category);
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json(category);
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.status(200).json(category);
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id);
  res.status(204).send();
});

export const listBrands = catchAsync(async (_req: Request, res: Response) => {
  const brands = await brandService.listBrands();
  res.status(200).json(brands);
});

export const getBrandBySlug = catchAsync(async (req: Request, res: Response) => {
  const brand = await brandService.getBrandBySlug(req.params.slug);
  if (!brand) throw new NotFoundError("Marque introuvable", "BRAND_NOT_FOUND");
  res.status(200).json(brand);
});

export const createBrand = catchAsync(async (req: Request, res: Response) => {
  const brand = await brandService.createBrand(req.body);
  res.status(201).json(brand);
});

export const removeBrand = catchAsync(async (req: Request, res: Response) => {
  await brandService.deleteBrand(req.params.id);
  res.status(204).send();
});
