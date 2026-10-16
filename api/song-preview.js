
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://gospelova.com";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end("Method Not Allowed");
  }

  const slug = String(req.query.slug || "").trim();

  if (!slug || slug.length > 200) {
    return res.status(400).end("Invalid song slug");
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Song preview: missing Supabase environment variables.");
    return res.status(500).end("Preview temporarily unavailable");
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: song, error } = await supabase
      .from("songs")
      .select(
        "title, slug, description, artist_name, cover_image_path, artists(name)"
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) throw error;

    if (!song) {
      return res.status(404).end("Song not found");
    }

    const artist =
      song.artists?.name || song.artist_name || "Unknown artist";

    const title = `${song.title} by ${artist} | Gospelova`;

    const description =
      stripHtml(song.description) ||
      `Discover ${song.title} by ${artist} on Gospelova. Listen to gospel music and explore the lyrics.`;

    const image = song.cover_image_path
      ? supabase.storage
          .from("song-cover")
          .getPublicUrl(song.cover_image_path).data.publicUrl
      : `${SITE_URL}/favicon.png`;

    const canonical = `${SITE_URL}/music/${encodeURIComponent(song.slug)}`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:site_name" content="Gospelova">
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:alt" content="${escapeHtml(`${song.title} cover art`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
</head>
<body>
  <p>Opening ${escapeHtml(song.title)} on Gospelova…</p>
  <script>window.location.replace(${JSON.stringify(canonical)});</script>
  <noscript><a href="${escapeHtml(canonical)}">Continue to ${escapeHtml(song.title)}</a></noscript>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    res.setHeader("X-Robots-Tag", "noindex, follow");

    if (req.method === "HEAD") {
      return res.status(200).end();
    }

    return res.status(200).send(html);
  } catch (error) {
    console.error("Song preview generation failed:", error.message);
    return res.status(500).end("Preview temporarily unavailable");
  }
}
