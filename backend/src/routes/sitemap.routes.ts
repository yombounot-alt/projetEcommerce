import { Router } from "express";
import { Product } from "../models/Product";
import { env } from "../config/env";

const router = Router();

// Static, publicly-indexable pages — mirrors ROUTES in frontend/src/constants/routes.constants.ts.
// Cart/checkout/account/admin/seller pages are intentionally excluded (private or transactional,
// already marked noIndex in the frontend's Seo component).
const STATIC_PATHS = [
  "/",
  "/shop",
  "/about",
  "/careers",
  "/sell-with-us",
  "/help/shipping",
  "/help/contact",
  "/help/faq",
  "/legal/terms",
  "/legal/privacy",
  "/legal/notice",
];

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Dynamically generated sitemap (products come from MongoDB, so a static file can't reflect
 * the real catalogue). Uses FRONTEND_URL for <loc> since that's the origin search engines
 * actually need to crawl, not this API's own origin.
 *
 * PRODUCTION NOTE: this must be reachable at https://<your-storefront-domain>/sitemap.xml —
 * if the frontend and this API are deployed on different origins, the frontend's host/proxy
 * must forward /sitemap.xml to this backend endpoint (a sitemap only counts for the origin
 * that serves it).
 */
router.get("/sitemap.xml", async (_req, res) => {
  const products = await Product.find({ status: "published" }).select("slug updatedAt").lean();

  const urls = [
    ...STATIC_PATHS.map((path) => ({
      loc: `${env.FRONTEND_URL}${path}`,
      lastmod: undefined as string | undefined,
    })),
    ...products.map((p) => ({
      loc: `${env.FRONTEND_URL}/product/${p.slug}`,
      lastmod: (p.updatedAt as Date | undefined)?.toISOString().slice(0, 10),
    })),
  ];

  const body = urls
    .map(
      (u) =>
        `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`,
    )
    .join("\n");

  res
    .type("application/xml")
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`,
    );
});

export default router;
