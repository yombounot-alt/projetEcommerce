import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { BadRequestError } from "../utils/AppError";
import * as uploadService from "../services/upload.service";

/**
 * The local-disk fallback (used when Cloudinary isn't configured) returns a path relative
 * to this server (e.g. "/uploads/foo.png"). Product/category schemas require a full URL
 * (`.url()`), so it must be resolved to an absolute one here — Cloudinary URLs are already
 * absolute and pass through unchanged.
 */
function toAbsoluteUrl(req: Request, url: string): string {
  if (!url.startsWith("/")) return url;
  return `${req.protocol}://${req.get("host")}${url}`;
}

export const uploadSingle = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestError("Aucun fichier fourni", "NO_FILE");
  const url = await uploadService.uploadImage(req.file);
  res.status(201).json({ url: toAbsoluteUrl(req, url) });
});

export const uploadMultiple = catchAsync(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw new BadRequestError("Aucun fichier fourni", "NO_FILES");
  const urls = await uploadService.uploadImages(files);
  res.status(201).json({ urls: urls.map((url) => toAbsoluteUrl(req, url)) });
});
