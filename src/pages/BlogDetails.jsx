import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import DOMPurify from "dompurify";
import "../styles/music.css";
import LoadingState from "../components/LoadingState";
import SEO from "../components/SEO";

function renderArticleContent(content = "") {
  // Legacy plain text should remain plain text.
  if (!/<\/?[a-z][\s\S]*>/i.test(content)) {
    return content
      .split(/\r?\n/)
      .map((paragraph, index) =>
        paragraph.trim() ? <p key={index}>{paragraph}</p> : null,
      );
  }

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(content, {
          USE_PROFILES: { html: true },
        }),
      }}
    />
  );
}

function BlogDetails() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      setError("");
      setPost(null);

      const { data, error: fetchError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (fetchError) {
        console.error("Article loading error:", fetchError);
        setError("We couldn't load this article. Please try again.");
      } else if (!data) {
        setError("This article was not found or is no longer available.");
      } else {
        setPost(data);
      }

      setLoading(false);
    }

    loadPost();
  }, [slug]);

  const coverUrl = post?.cover_image_path
    ? supabase.storage.from("song-cover").getPublicUrl(post.cover_image_path)
        .data.publicUrl
    : null;

  const formattedDate = post?.published_at
    ? new Date(post.published_at).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const seoDescription =
    post?.excerpt?.trim() ||
    `Read ${post?.title || "this gospel article"} on Gospelova, featuring gospel music news, artist stories, and inspiring Christian content.`;

  return (
    <>
      {post && (
        <SEO
          title={post.title}
          description={seoDescription}
          image={coverUrl || undefined}
          url={`/blog/${post.slug}`}
          type="article"
        />
      )}

      <section className="music-page gospel-article-page">
        <div className="container">
          <Link to="/blog" className="gospel-article-back">
            ← Back to Gospel News
          </Link>

          {loading && <LoadingState message="Loading gospel article..." />}

          {!loading && error && (
            <div className="music-page__status" role="alert">
              {error}
            </div>
          )}

          {!loading && post && (
            <article className="gospel-article">
              <header className="gospel-article-header">
                <p className="music-page__eyebrow">{post.category}</p>

                <h1 className="music-page__title">{post.title}</h1>

                {post.excerpt && (
                  <p className="music-page__description gospel-article-excerpt">
                    {post.excerpt}
                  </p>
                )}

                <p className="gospel-article-meta">
                  By {post.author || "Gospelova"}
                  {formattedDate && ` · ${formattedDate}`}
                </p>
              </header>

              {coverUrl && (
                <img
                  className="gospel-article-cover"
                  src={coverUrl}
                  alt={post.title}
                />
              )}

              <div className="gospel-article-content">
                {renderArticleContent(post.content)}
              </div>

              {post.source_name && post.source_url && (
                <p className="gospel-article-source">
                  Original source:{" "}
                  <a
                    href={post.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {post.source_name}
                  </a>
                </p>
              )}

              <footer className="gospel-article-footer">
                <Link to="/blog" className="music-page__view-link">
                  ← More Gospel News & Stories
                </Link>
              </footer>
            </article>
          )}
        </div>
      </section>
    </>
  );
}

export default BlogDetails;
