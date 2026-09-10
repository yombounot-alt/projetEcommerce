export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.fieldErrors = fieldErrors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(
    message = "Requête invalide",
    code = "BAD_REQUEST",
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message, 400, code, fieldErrors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Non authentifié", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Accès refusé", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflit", code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Échec de la validation", fieldErrors?: Record<string, string[]>) {
    super(message, 422, "VALIDATION_ERROR", fieldErrors);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Trop de requêtes", code = "TOO_MANY_REQUESTS") {
    super(message, 429, code);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service temporairement indisponible", code = "SERVICE_UNAVAILABLE") {
    super(message, 503, code);
  }
}
