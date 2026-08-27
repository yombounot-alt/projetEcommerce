/**
 * Simule une latence réseau réaliste pour les services en mode mock, afin que les
 * états de chargement (skeletons, spinners) soient développés et testés dans les
 * mêmes conditions qu'avec une API réelle.
 */
export function mockDelay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
