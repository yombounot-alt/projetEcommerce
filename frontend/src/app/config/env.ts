/**
 * Point d'accès unique aux variables d'environnement (Vite expose import.meta.env).
 * Centraliser la lecture ici évite les accès directs dispersés et facilite
 * la validation/le typage des variables.
 */
function readEnv(key: string, fallback = ""): string {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export const env = {
  apiUrl: readEnv("VITE_API_URL", "/api"),
  appUrl: readEnv("VITE_APP_URL", "http://localhost:5173"),
  useMocks: readEnv("VITE_USE_MOCKS", "true") === "true",
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
