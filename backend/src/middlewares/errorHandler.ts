import type { NextFunction, Request, Response } from "express";
import { MongoServerError } from "mongodb";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { isProduction } from "../config/env";

interface ErrorResponseBody {
  message: string;
  code: string;
  fieldErrors?: Record<string, string[]>;
}

function fromZodError(error: ZodError): { message: string; fieldErrors: Record<string, string[]> } {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    fieldErrors[path] = [...(fieldErrors[path] ?? []), issue.message];
  }
  return { message: "Échec de la validation", fieldErrors };
}

function fromMongooseValidationError(error: mongoose.Error.ValidationError): {
  message: string;
  fieldErrors: Record<string, string[]>;
} {
  const fieldErrors: Record<string, string[]> = {};
  for (const [path, err] of Object.entries(error.errors)) {
    fieldErrors[path] = [err.message];
  }
  return { message: "Échec de la validation", fieldErrors };
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    code: "ROUTE_NOT_FOUND",
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let body: ErrorResponseBody = { message: "Erreur interne du serveur", code: "INTERNAL_ERROR" };

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    body = { message: error.message, code: error.code, fieldErrors: error.fieldErrors };
  } else if (error instanceof ZodError) {
    statusCode = 422;
    const { message, fieldErrors } = fromZodError(error);
    body = { message, code: "VALIDATION_ERROR", fieldErrors };
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    const { message, fieldErrors } = fromMongooseValidationError(error);
    body = { message, code: "VALIDATION_ERROR", fieldErrors };
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    body = { message: `Valeur invalide pour le champ "${error.path}"`, code: "INVALID_ID" };
  } else if (error instanceof MongoServerError && error.code === 11000) {
    statusCode = 409;
    const field =
      Object.keys((error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {})[0] ??
      "champ";
    body = { message: `Valeur déjà utilisée pour le champ "${field}"`, code: "DUPLICATE_KEY" };
  } else if (error instanceof SyntaxError && "body" in error) {
    statusCode = 400;
    body = { message: "Corps de requête JSON invalide", code: "INVALID_JSON" };
  } else if (error instanceof Error) {
    body.message = isProduction ? "Erreur interne du serveur" : error.message;
  }

  if (statusCode >= 500) {
    logger.error(body.message, {
      code: body.code,
      path: req.originalUrl,
      method: req.method,
      stack: error instanceof Error ? error.stack : undefined,
    });
  } else {
    logger.warn(body.message, { code: body.code, path: req.originalUrl, method: req.method });
  }

  res.status(statusCode).json(body);
}
