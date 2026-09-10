import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "lumera", resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      },
    );
    stream.end(file.buffer);
  });
}

/** Local disk fallback for development when Cloudinary credentials are not configured. */
async function uploadToLocalDisk(file: Express.Multer.File): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.originalname).toLowerCase() || ".bin";
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}

export async function uploadImage(file: Express.Multer.File): Promise<string> {
  return isCloudinaryConfigured ? uploadToCloudinary(file) : uploadToLocalDisk(file);
}

export async function uploadImages(files: Express.Multer.File[]): Promise<string[]> {
  return Promise.all(files.map(uploadImage));
}
