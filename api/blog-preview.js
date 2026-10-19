
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
    return res.status(400).end("Invalid blog slug");
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Blog preview: missing Supabase environment variables.");
    return res.status(500).end("Preview temporarily unavailable");
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(
        "title, slug, excerpt, cover_image_path, category, author, published_at, source_name, source_url"
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) throw error;

    if (!post) {
      return res.status(404).end("Blog article not found");
    }

    const title = `${post.title} | Gospelova`;

    const description =
      stripHtml(post.excerpt) ||
      `Read ${post.title} on Gospelova for gospel news, artist stories, and inspiring Christian content.`;

    const image = post.cover_image_path
      ? supabase.storage
          .from("song-cover")
          .getPublicUrl(post.cover_image_path).data.publicUrl
      : `${SITE_URL}/favicon.png`;

    const canonical =
      `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      url: canonical,
      mainEntityOfPage: canonical,
      publisher: {
        "@type": "Organization",
        name: "Gospelova",
        url: SITE_URL,
      },
      ...(post.author && {
        author: {
          "@type": "Person",
          name: post.author,
        },
      }),
      ...(post.published_at && {
        datePublished: post.published_at,
      }),
      ...(image && { image }),
      ...(post.category && { articleSection: post.category }),
    };

    const safeStructuredData = JSON.stringify(structuredData).replace(
      /</g,
      "\\u003c"
    );

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">

  <meta name="robots" content="index, follow">

  <meta property="og:site_name" content="Gospelova">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:alt" content="${escapeHtml(`${post.title} cover image`)}">

  ${post.published_at ? `<meta property="article:published_time" content="${escapeHtml(post.published_at)}">` : ""}
  ${post.author ? `<meta property="article:author" content="${escapeHtml(post.author)}">` : ""}
  ${post.category ? `<meta property="article:section" content="${escapeHtml(post.category)}">` : ""}

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">

  <script type="application/ld+json">${safeStructuredData}</script>
</head>
<body>
  <p>Opening ${escapeHtml(post.title)} on Gospelova…</p>
  <script>window.location.replace(${JSON.stringify(canonical)});</script>
  <noscript>
    <a href="${escapeHtml(canonical)}">Continue to ${escapeHtml(post.title)}</a>
  </noscript>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    if (req.method === "HEAD") {
      return res.status(200).end();
    }

    return res.status(200).send(html);
  } catch (error) {
    console.error("Blog preview generation failed:", error.message);
    return res.status(500).end("Preview temporarily unavailable");
  }
}
