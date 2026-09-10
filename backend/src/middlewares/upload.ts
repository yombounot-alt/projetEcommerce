import multer from "multer";
import { BadRequestError } from "../utils/AppError";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;

/**
 * Memory storage only — files are streamed straight to Cloudinary (or written to disk by
 * upload.service in the local fallback) and never persisted as multer's own temp files.
 * MIME type is checked from the actual upload stream, never trusted from the client-supplied
 * filename extension (rule 35).
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(
        new BadRequestError(`Type de fichier non supporté : ${file.mimetype}`, "UNSUPPORTED_FILE_TYPE"),
      );
      return;
    }
    callback(null, true);
  },
});
