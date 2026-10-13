
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnv } from "vite";

const SITE_URL = "https://gospelova.com";

const env = loadEnv("production", process.cwd(), "");

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

const staticPages = [
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

const { data: songs, error } = await supabase
  .from("songs")
  .select("slug, updated_at, created_at")
  .eq("is_published", true);

if (error) {
  throw new Error(`Could not fetch published songs: ${error.message}`);
}

const pages = [
  ...staticPages.map((path) => ({
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

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const entries = pages
  .map(
    ({ url, lastmod }) => `  <url>
    <loc>${escapeXml(url)}</loc>
    ${lastmod ? `<lastmod>${escapeXml(new Date(lastmod).toISOString())}</lastmod>` : ""}
  </url>`
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

const outputPath = resolve("public", "sitemap.xml");
await writeFile(outputPath, sitemap, "utf8");

console.log(`Sitemap generated with ${pages.length} URLs.`);
