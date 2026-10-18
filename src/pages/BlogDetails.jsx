import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import DOMPurify from "dompurify";
import "../styles/music.css";
import LoadingState from "../components/LoadingState";
import SEO from "../components/SEO";
import Comments from "../components/Comments";

function renderArticleContent(content = "") {
  // Keep legacy plain text as paragraphs.
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
  const [shareNotice, setShareNotice] = useState("");
  const [relatedPosts, setRelatedPosts] = useState([]);

  const getBlogUrl = () => window.location.href;

  const copyBlogLink = async () => {
    try {
      await navigator.clipboard.writeText(getBlogUrl());
      setShareNotice("Article link copied successfully!");
    } catch {
      setShareNotice(
        "Unable to copy the link. Please copy the URL from your browser.",
      );
    }
  };

  const shareBlog = async () => {
    const url = getBlogUrl();
    const title = post?.title || "Gospelova Article";

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Read "${title}" on Gospelova.`,
          url,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setShareNotice(
            "Unable to open the share menu. Try copying the link.",
          );
        }
      }
    } else {
      await copyBlogLink();
    }
  };

  const shareBlogToWhatsApp = () => {
    const title = post?.title || "Gospelova Article";
    const message = `Read "${title}" on Gospelova:\n${getBlogUrl()}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

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

        const { data: relatedData, error: relatedError } = await supabase
          .from("blog_posts")
          .select("id, title, slug, excerpt, cover_image_path, published_at")
          .eq("is_published", true)
          .neq("id", data.id)
          .order("published_at", { ascending: false })
          .limit(3);

        if (relatedError) {
          console.error("Related articles loading error:", relatedError);
          setRelatedPosts([]);
        } else {
          setRelatedPosts(relatedData || []);
        }
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

              <div className="song-details__actions gospel-article-actions">
                <button
                  type="button"
                  className="song-action"
                  onClick={copyBlogLink}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="8" y="8" width="12" height="12" rx="2" />
                    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                  </svg>
                  <span>Copy Link</span>
                </button>

                <button
                  type="button"
                  className="song-action song-action--share"
                  onClick={shareBlog}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="m8.7 10.5 6.6-4m-6.6 9 6.6 4" />
                  </svg>
                  <span>Share Article</span>
                </button>

                <button
                  type="button"
                  className="song-action song-action--whatsapp"
                  onClick={shareBlogToWhatsApp}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.1A8.5 8.5 0 1 1 20 11.5Z" />
                    <path d="M8 8.2c.4 2.4 2 4.3 4.5 5.3l1.4-1.1 2 1c-.2 1.3-1.2 2-2.5 1.8-3.4-.6-6.5-3.7-7-7-.2-1.3.5-2.3 1.8-2.5l1 2L8 8.2Z" />
                  </svg>
                  <span>WhatsApp</span>
                </button>
              </div>

              {shareNotice && (
                <div className="song-share-toast" role="status">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8 12 2.5 2.5L16 9" />
                  </svg>

                  <span>{shareNotice}</span>

                  <button
                    type="button"
                    onClick={() => setShareNotice("")}
                    aria-label="Dismiss notification"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              )}
            </article>
          )}

          {!loading && post && (
            <Comments targetType="blog" targetId={post.id} />
          )}

          {!loading && post && relatedPosts.length > 0 && (
            <section className="blog-recommendations">
              <h2>You Might Also Like</h2>
              <p>
                Discover more gospel news, artist stories, and inspiring
                content.
              </p>

              <div className="blog-recommendations__grid">
                {relatedPosts.map((relatedPost) => {
                  const relatedCover = relatedPost.cover_image_path
                    ? supabase.storage
                        .from("song-cover")
                        .getPublicUrl(relatedPost.cover_image_path).data
                        .publicUrl
                    : null;

                  return (
                    <article
                      className="blog-recommendations__card"
                      key={relatedPost.id}
                    >
                      <Link
                        to={`/blog/${relatedPost.slug}`}
                        className="blog-recommendations__link"
                      >
                        {relatedCover ? (
                          <img
                            src={relatedCover}
                            alt={`${relatedPost.title} cover`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="blog-recommendations__placeholder">
                            Gospelova
                          </div>
                        )}

                        <div className="blog-recommendations__info">
                          <h3>{relatedPost.title}</h3>

                          {relatedPost.excerpt && <p>{relatedPost.excerpt}</p>}

                          <span>Read Article →</span>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <footer className="gospel-article-footer">
            <Link to="/blog" className="music-page__view-link">
              ← More Gospel News & Stories
            </Link>
          </footer>
        </div>
      </section>
    </>
  );
}

export default BlogDetails;
