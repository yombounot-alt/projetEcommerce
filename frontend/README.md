# Luméra — Frontend E-commerce

Fondation frontend production-ready pour une plateforme e-commerce multi-vendeurs :
catalogue, panier, favoris, checkout, comptes clients, dashboard administrateur et
dashboard vendeur. Conçue pour évoluer vers une architecture à forte volumétrie
(multi-vendeurs, multi-devises, paiement, recherche avancée) sans réécriture majeure.

## Stack technique

| Domaine | Choix | Justification |
| --- | --- | --- |
| Build | Vite | Démarrage instantané, HMR rapide, build optimisé (Rollup) |
| Langage | TypeScript (strict) | Sécurité de type, maintenabilité à long terme |
| UI | React 19 | Écosystème mature, concurrent rendering |
| Style | Tailwind CSS v4 | Design system utilitaire, thème clair/sombre via variables CSS |
| Composants | shadcn/ui (Radix UI + CVA) | Composants accessibles, non verrouillés dans une lib externe |
| Routing | React Router v7 | Standard de facto, routes imbriquées, lazy loading |
| État serveur | TanStack Query | Cache, invalidation, retries, états loading/error uniformisés |
| État global UI | Zustand | Léger, sans boilerplate, uniquement pour l'état réellement global |
| Formulaires | React Hook Form + Zod | Validation typée, performances (re-renders maîtrisés) |
| HTTP | Axios | Intercepteurs (auth, erreurs), configuration centralisée |
| Icônes | lucide-react | Set cohérent, tree-shakable |
| SEO | react-helmet-async | Metadata dynamiques par page (title, OG, canonical) |
| Tests | Vitest + Testing Library | Rapide, compatible Vite, API proche de Jest |

Aucune dépendance n'a été ajoutée sans justification architecturale (voir `package.json`).

## Architecture

```text
src/
├── app/            # Bootstrap : providers, router, configuration d'environnement
├── components/     # UI réutilisable (ui/ = primitives shadcn, common/, layout/, shared/)
├── features/       # Logique métier par domaine (auth, products, cart, orders, checkout…)
│   └── <feature>/
│       ├── api/        # Hooks TanStack Query (queries + mutations)
│       └── components/ # Composants spécifiques au domaine
├── pages/          # Composants de page, un par route (public/, auth/, account/, admin/, seller/)
├── layouts/         # Layouts partagés (Public, Auth, Dashboard, Admin, Seller)
├── api/            # Client HTTP (Axios) + services par ressource
├── store/          # Stores Zustand (authStore, cartStore, wishlistStore, uiStore)
├── schemas/        # Schémas de validation Zod
├── types/          # Types TypeScript partagés
├── mocks/          # Données de démonstration réalistes
├── hooks/          # Hooks génériques réutilisables
├── utils/          # Fonctions utilitaires pures
└── constants/      # Constantes globales (routes, configuration applicative)
```

**Principes appliqués** : séparation UI / logique métier / accès aux données, state
serveur toujours géré par TanStack Query (jamais dupliqué dans Zustand), composants
« dumb » réutilisables séparés des composants connectés aux données, aucune logique
métier dans les composants `ui/`.

## Démarrage

```bash
npm install
cp .env.example .env   # ou ajustez .env.development directement
npm run dev
```

L'application démarre entièrement **sans backend** grâce à la couche de mock
(`src/mocks/`) branchée derrière les mêmes interfaces de service que l'API réelle
(voir « Mode mock » ci-dessous).

## Scripts disponibles

| Commande | Description |
| --- | --- |
| `npm run dev` | Démarre le serveur de développement Vite |
| `npm run build` | Vérifie les types puis build de production dans `dist/` |
| `npm run preview` | Sert le build de production localement |
| `npm run lint` | Analyse statique ESLint |
| `npm run lint:fix` | Corrige automatiquement les problèmes ESLint réparables |
| `npm run format` | Formate le code avec Prettier |
| `npm run format:check` | Vérifie le formatage sans modifier les fichiers |
| `npm run typecheck` | Vérifie les types sans build complet |
| `npm test` | Lance les tests unitaires (Vitest) |
| `npm run test:ui` | Interface graphique Vitest |

## Variables d'environnement

Voir `.env.example`. Aucun secret réel n'est stocké dans le dépôt : les fichiers
`.env`, `.env.local` et `.env.*.local` sont ignorés par Git. Les fichiers
`.env.development` / `.env.production` ne contiennent que de la configuration
publique (URLs, feature flags), jamais de clé secrète.

| Variable | Rôle |
| --- | --- |
| `VITE_API_URL` | URL de base de l'API backend |
| `VITE_APP_URL` | URL publique du frontend (SEO, Open Graph) |
| `VITE_USE_MOCKS` | `true` pour utiliser les données mock, `false` pour appeler l'API réelle |

## Mode mock et connexion à un backend réel

Chaque service (`src/api/services/*.ts`) expose la même interface, qu'il s'agisse
de données mock ou d'un appel HTTP réel :

```ts
async list(filters) {
  if (env.useMocks) return mockDelay(/* … */);
  const { data } = await httpClient.get("/products", { params: filters });
  return data;
}
```

Pour brancher un backend réel : définissez `VITE_API_URL` et passez
`VITE_USE_MOCKS=false`. Aucun composant ni hook TanStack Query n'a besoin d'être
modifié, car ils consomment uniquement les fonctions exportées par `services/`.

Comptes de démonstration (mode mock, mot de passe libre ≥ 8 caractères) :

- `admin@lumera.example` — accès `/admin`
- `seller@lumera.example` — accès `/seller`
- `customer@lumera.example` — espace client

## Sécurité

- Le frontend n'est **jamais** considéré comme une frontière de sécurité : toute
  autorisation affichée côté UI (`ProtectedRoute`, menus conditionnels) doit être
  revalidée côté backend.
- Le token de session n'est jamais persisté en `localStorage` ; seul le profil
  utilisateur (non sensible) l'est, pour restaurer l'UI après rechargement.
  `httpClient` est configuré avec `withCredentials: true` pour permettre l'usage
  de cookies `HttpOnly`/`SameSite` dès qu'un backend réel est branché.
- Aucune donnée bancaire n'est jamais saisie ni stockée côté frontend (voir
  `PaymentStep`) : l'intégration d'un prestataire de paiement (Stripe, PayPal…)
  se fera via son propre SDK/redirection.
- Les erreurs API sont normalisées (`ApiError`) sans jamais exposer de détails
  d'implémentation sensibles à l'utilisateur final.

## Déploiement

`npm run build` génère un bundle statique optimisé dans `dist/` (code-splitting
par route via `React.lazy`, chunks vendor séparés). Ce dossier peut être servi par
n'importe quel hébergeur statique ou CDN (Vercel, Netlify, S3+CloudFront, Nginx…).
Configurez les variables d'environnement de production **au moment du build**
(Vite les inline à la compilation).

## Conventions

- Alias d'import `@/…` pointant vers `src/`.
- Un composant par fichier, nommage `PascalCase.tsx` pour les composants,
  `camelCase.ts` pour les utilitaires/hooks.
- Pas de `any` sans justification ; `verbatimModuleSyntax` impose `import type`
  pour les imports de types.
- Les clés de cache TanStack Query sont centralisées dans `src/api/query-keys.ts`.
