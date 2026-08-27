import type { ApiErrorPayload } from "./common.types";

/**
 * Erreur normalisée levée par l'intercepteur Axios pour toute réponse en échec.
 * Permet aux couches supérieures (TanStack Query, formulaires) de traiter les
 * erreurs de façon uniforme sans dépendre de la forme exacte de la réponse HTTP.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.code = payload.code;
    this.fieldErrors = payload.fieldErrors;
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}
