/**
 * Insère des transformations Cloudinary (largeur, format auto AVIF/WebP, qualité auto) dans
 * une URL de livraison Cloudinary — seul cas où c'est sûr : les images hébergées ailleurs
 * (Unsplash utilisé en donnée de démo, fallback disque local en dev sans Cloudinary configuré)
 * n'ont pas ce format d'URL et sont donc renvoyées inchangées, jamais cassées.
 */
export function optimizedImageUrl(url: string, width: number): string {
  const marker = "/image/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;

  const prefix = url.slice(0, index + marker.length);
  const suffix = url.slice(index + marker.length);
  return `${prefix}f_auto,q_auto,w_${width}/${suffix}`;
}
