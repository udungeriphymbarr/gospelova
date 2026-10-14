
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://gospelova.com";

const STATIC_PAGES = [
  "/",
  "/music",
  "/lyrics",
  "/artists",
  "/categories",
  "/blog",
  "/about",
  "/contact",
  "/privacy",
  "/copyright",
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end("Method Not Allowed");
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Sitemap: missing Supabase environment variables.");
    return res.status(500).end("Sitemap temporarily unavailable");
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: songs, error } = await supabase
      .from("songs")
      .select("slug, updated_at, created_at")
      .eq("is_published", true);

    if (error) throw error;

    const pages = [
      ...STATIC_PAGES.map((path) => ({
        url: `${SITE_URL}${path}`,
        lastmod: null,
      })),
      ...(songs ?? [])
        .filter((song) => song.slug)
        .map((song) => ({
          url: `${SITE_URL}/music/${encodeURIComponent(song.slug)}`,
          lastmod: song.updated_at || song.created_at || null,
        })),
    ];

    const entries = pages
      .map(({ url, lastmod }) => {
        const lastmodTag = lastmod
          ? `<lastmod>${escapeXml(new Date(lastmod).toISOString())}</lastmod>`
          : "";

        return `  <url>
    <loc>${escapeXml(url)}</loc>
    ${lastmodTag}
  </url>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    if (req.method === "HEAD") {
      return res.status(200).end();
    }

    return res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap generation failed:", error.message);
    return res.status(500).end("Sitemap temporarily unavailable");
  }
}
