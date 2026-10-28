import { Helmet } from "react-helmet-async";

const SITE_NAME = "Gospelova";
const SITE_URL = "https://gospelova.com";

const DEFAULT_TITLE = "Gospelova | Gospel Music, Songs, Lyrics & News";
const DEFAULT_DESCRIPTION =
  "Discover gospel music, download songs, explore lyrics, find gospel artists, and read the latest gospel news and stories on Gospelova.";

function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  url,
  type = "website",
  noIndex = false,
  structuredData,
}) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

  const canonicalUrl = new URL(url || window.location.pathname, SITE_URL).href;

  const imageUrl = image ? new URL(image, SITE_URL).href : undefined;

  return (
    <Helmet>
      <title>{pageTitle}</title>

      <meta name="description" content={description} />

      <link rel="canonical" href={canonicalUrl} />

      <meta
        name="robots"
        content={noIndex ? "noindex, nofollow" : "index, follow"}
      />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />

      {imageUrl && <meta property="og:image" content={imageUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />

      {imageUrl && <meta name="twitter:image" content={imageUrl} />}

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

export default SEO;
