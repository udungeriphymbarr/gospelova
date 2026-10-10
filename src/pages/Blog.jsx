import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/music.css";
import LoadingState from "../components/LoadingState";

function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("blog_posts")
        .select(
          "id, title, slug, excerpt, cover_image_path, category, author, source_name, source_url, published_at",
        )
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (fetchError) {
        console.error("Blog loading error:", fetchError);
        setError("We couldn't load the news right now. Please try again.");
      } else {
        setPosts(data || []);
      }

      setLoading(false);
    }

    loadPosts();
  }, []);

  function getCoverUrl(path) {
    if (!path) return null;

    return supabase.storage.from("song-cover").getPublicUrl(path).data
      .publicUrl;
  }

  function formatDate(date) {
    if (!date) return "Recently published";

    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <section className="music-page gospel-blog-page">
      <div className="container">
        <header className="music-page__header">
          <p className="music-page__eyebrow">GOSPELOVA JOURNAL</p>
          <h1 className="music-page__title">Gospel News & Stories</h1>
          <p className="music-page__description">
            Discover gospel music news, artist stories, new releases, and
            inspiring updates from the gospel music community.
          </p>
        </header>

        {loading && (
          <LoadingState message="Loading gospel news and stories..." />
        )}

        {!loading && error && (
          <div className="music-page__status" role="alert">
            {error}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="gospel-blog-retry"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="music-page__status">
            <h2>No articles published yet</h2>
            <p>
              Gospel news and stories will appear here when they are published.
            </p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="music-page__grid">
            {posts.map((post) => {
              const coverUrl = getCoverUrl(post.cover_image_path);

              return (
                <article className="music-page__card" key={post.id}>
                  {coverUrl ? (
                    <img
                      className="music-page__cover"
                      src={coverUrl}
                      alt={post.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="music-page__cover music-page__cover-placeholder">
                      ♪
                    </div>
                  )}

                  <p className="gospel-blog-category">{post.category}</p>

                  <h2 className="music-page__song-title">{post.title}</h2>

                  <p className="gospel-blog-meta">
                    {post.author} · {formatDate(post.published_at)}
                  </p>

                  {post.excerpt && (
                    <p className="gospel-blog-excerpt">{post.excerpt}</p>
                  )}

                  {post.source_name && post.source_url && (
                    <p className="gospel-blog-source">
                      Source:{" "}
                      <a
                        href={post.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {post.source_name}
                      </a>
                    </p>
                  )}

                  <div className="music-page__actions">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="music-page__view-link"
                    >
                      Read Article →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Blog;
