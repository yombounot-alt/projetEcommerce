export const APP_NAME = "Luméra";
export const APP_DESCRIPTION =
  "Luméra — une expérience e-commerce premium, rapide et fiable.";
export const APP_URL = import.meta.env.VITE_APP_URL ?? "https://www.lumera.example";
export const DEFAULT_CURRENCY = "GNF";
export const DEFAULT_LOCALE = "fr-FR";

export const PAGE_SIZE_DEFAULT = 12;
export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export const QUERY_STALE_TIME_MS = 60_000;
export const QUERY_GC_TIME_MS = 5 * 60_000;

export const AUTH_TOKEN_STORAGE_KEY = "lumera.auth.access_token";
export const CART_STORAGE_KEY = "lumera.cart";
export const WISHLIST_STORAGE_KEY = "lumera.wishlist";

// Mirrors backend/src/constants/shipping.ts — amounts are in GNF, scaled to the real
// catalogue (60 000 - 2 500 000 GNF per product), not the old placeholder USD-style decimals.
export const FREE_SHIPPING_THRESHOLD = 500_000;
export const STANDARD_SHIPPING_COST = 20_000;
export const EXPRESS_SHIPPING_COST = 40_000;
