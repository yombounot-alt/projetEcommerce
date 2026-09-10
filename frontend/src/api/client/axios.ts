import axios, { AxiosError } from "axios";
import { env } from "@/app/config/env";
import { ApiError } from "@/types/api.types";
import type { ApiErrorPayload } from "@/types/common.types";

/**
 * Instance Axios unique de l'application.
 *
 * Sécurité :
 * - `withCredentials` est activé pour permettre, côté backend réel, l'usage de cookies
 *   HttpOnly/SameSite pour la session (préférable au stockage du token en localStorage).
 * - Le token d'accès, quand il existe, est conservé en mémoire (voir authStore) et jamais
 *   persisté en clair dans localStorage — seul le profil utilisateur (non sensible) l'est.
 * - Aucune donnée bancaire ne transite jamais par ce client : le paiement sera délégué
 *   à un prestataire tiers (ex. SDK Stripe côté client) qui ne renvoie qu'une référence.
 */
export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

type AccessTokenGetter = () => string | null;
type UnauthorizedHandler = () => void;
type RefreshHandler = () => Promise<string | null>;

let getAccessToken: AccessTokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};
let refreshAccessToken: RefreshHandler = async () => null;

/** Permet à authStore d'injecter ses accesseurs sans créer de dépendance circulaire au niveau module. */
export function registerAuthHandlers(handlers: {
  getAccessToken: AccessTokenGetter;
  onUnauthorized: UnauthorizedHandler;
  refreshAccessToken: RefreshHandler;
}) {
  getAccessToken = handlers.getAccessToken;
  onUnauthorized = handlers.onUnauthorized;
  refreshAccessToken = handlers.refreshAccessToken;
}

// Endpoints qui ne doivent jamais déclencher une tentative de refresh sur 401
// (login/register échouent légitimement avec 401/409, et /auth/refresh est la cible du refresh
// lui-même — le laisser passer par ce chemin créerait une boucle infinie).
const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

let pendingRefresh: Promise<string | null> | null = null;

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<Partial<ApiErrorPayload>>) => {
    const status = error.response?.status ?? 0;
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const url = originalRequest?.url ?? "";
    const isRefreshable = status === 401 && originalRequest && !originalRequest._retry && !NO_REFRESH_PATHS.some((p) => url.includes(p));

    if (isRefreshable) {
      originalRequest._retry = true;
      pendingRefresh ??= refreshAccessToken().finally(() => {
        pendingRefresh = null;
      });
      const newToken = await pendingRefresh;
      if (newToken) {
        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
        return httpClient(originalRequest);
      }
      onUnauthorized();
    } else if (status === 401) {
      onUnauthorized();
    }

    const payload: ApiErrorPayload = {
      message: error.response?.data?.message ?? "Une erreur inattendue est survenue. Veuillez réessayer.",
      code: error.response?.data?.code ?? (error.code || "UNKNOWN_ERROR"),
      status,
      fieldErrors: error.response?.data?.fieldErrors,
    };

    return Promise.reject(new ApiError(payload));
  },
);
