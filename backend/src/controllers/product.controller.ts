import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { NotFoundError } from "../utils/AppError";
import * as productService from "../services/product.service";

export const list = catchAsync(async (req: Request, res: Response) => {
  const isPublicRoute = !req.user || req.user.role === "customer";
  const filters = req.query as productService.ProductListFilters;
  // A seller only ever sees their own catalogue — force-override any client-supplied
  // `seller` filter so this holds regardless of which route reaches this controller
  // (marketplace isolation; see seller.routes.ts for the storefront-specific route that
  // already did this — this makes the generic /products endpoint safe too).
  if (req.user?.role === "seller") {
    filters.seller = req.user.id;
  }
  const result = await productService.listProducts(filters, isPublicRoute);
  res.status(200).json(result);
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json(product);
});

export const getBySlug = catchAsync(async (req: Request, res: Response) => {
  const product = await productService.getProductBySlug(req.params.slug);
  if (!product) throw new NotFoundError("Produit introuvable", "PRODUCT_NOT_FOUND");
  res.status(200).json(product);
});

export const getRelated = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 4;
  const related = await productService.getRelatedProducts(req.params.id, limit);
  res.status(200).json(related);
});

export const getFeatured = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 8;
  const products = await productService.getFeaturedProducts(limit);
  res.status(200).json(products);
});

export const getNewArrivals = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 8;
  const products = await productService.getNewArrivals(limit);
  res.status(200).json(products);
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.user!.id, req.body);
  res.status(201).json(product);
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.user!.id,
    req.user!.role,
    req.body,
  );
  res.status(200).json(product);
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.params.id, req.user!.id, req.user!.role);
  res.status(204).send();
});
