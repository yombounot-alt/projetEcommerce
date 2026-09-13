// Formate automatiquement les fichiers stagés avant chaque commit avec le Prettier de
// chaque sous-projet (backend/frontend ont leurs propres devDependencies et configs) —
// évite la dérive de formatage qui a fini par toucher 150+ fichiers avant la mise en place
// de ce hook. Le lint complet (eslint/oxlint) et les tests restent dans la CI : plus lents,
// ils n'ont pas leur place dans un hook qui doit rester rapide.
export default {
  "backend/**/*.ts": ["backend/node_modules/.bin/prettier --write"],
  "frontend/**/*.{ts,tsx,css}": ["frontend/node_modules/.bin/prettier --write"],
};
