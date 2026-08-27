import { Helmet } from "react-helmet-async";
import { APP_NAME, APP_URL } from "@/constants/app.constants";

interface SeoProps {
  title: string;
  description?: string;
  image?: string;
  canonicalPath?: string;
  noIndex?: boolean;
}

export function Seo({ title, description, image, canonicalPath, noIndex = false }: SeoProps) {
  const fullTitle = title === APP_NAME ? title : `${title} · ${APP_NAME}`;
  const canonicalUrl = canonicalPath ? `${APP_URL}${canonicalPath}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
