import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Isole les dépendances "socle" (déjà chargées eagerly par main.tsx quelle que soit
        // la route) dans des chunks nommés à hash stable : un déploiement qui ne touche qu'au
        // code applicatif n'invalide plus ce cache navigateur pour les visiteurs récurrents.
        // Ne PAS y ajouter recharts/d3 : ils ne sont utilisés que par des routes admin/vendeur
        // chargées en dynamic import — les regrouper ici risquerait de les rendre eager.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("@tanstack")) return "vendor-query";
          if (/[\\/]react(-dom)?[\\/]|\/scheduler\//.test(id)) return "vendor-react";
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      // Fallback local de stockage des uploads (voir upload.service.ts backend) : servi par
      // Express en dehors du préfixe /api, donc il a besoin de sa propre règle de proxy.
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
