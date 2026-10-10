import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import SectionHeading from "../components/SectionHeading";
import SongCard from "../components/SongCard";
import ArtistCard from "../components/ArtistCard";
import CategoryCard from "../components/CategoryCard";
import BlogCard from "../components/BlogCard";
import LoadingState from "../components/LoadingState";

function Home() {
  const [latestSongs, setLatestSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [songsError, setSongsError] = useState("");
  const [popularArtists, setPopularArtists] = useState([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [artistsError, setArtistsError] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  const [latestPosts, setLatestPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");

  useEffect(() => {
    async function fetchLatestSongs() {
      const { data, error } = await supabase
        .from("songs")
        .select(
          `
          id,
          title,
          slug,
          cover_image_path,
          audio_path,
          artists ( name )
        `,
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Error fetching homepage songs:", error);
        setSongsError("We couldn't load the latest songs.");
      } else {
        setLatestSongs(data ?? []);
      }

      setSongsLoading(false);
    }

    fetchLatestSongs();
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchPopularArtists() {
      setArtistsLoading(true);
      setArtistsError("");

      try {
        const { data, error } = await supabase
          .from("artists")
          .select("id, name, slug, image_path")
          .order("created_at", { ascending: false })
          .limit(4);

        if (error) throw error;

        const formattedArtists = (data ?? []).map((artist) => ({
          ...artist,
          image: artist.image_path
            ? supabase.storage
                .from("song-cover")
                .getPublicUrl(artist.image_path).data.publicUrl
            : null,
        }));

        if (active) setPopularArtists(formattedArtists);
      } catch (err) {
        console.error("Error fetching homepage artists:", err);

        if (active) {
          setArtistsError("We couldn't load the artists right now.");
        }
      } finally {
        if (active) setArtistsLoading(false);
      }
    }

    fetchPopularArtists();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchCategories() {
      setCategoriesLoading(true);
      setCategoriesError("");

      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug, description")
          .order("name", { ascending: true });

        if (error) throw error;

        if (active) {
          setCategories(data ?? []);
        }
      } catch (err) {
        console.error("Error fetching homepage categories:", err);

        if (active) {
          setCategoriesError("We couldn't load the categories right now.");
        }
      } finally {
        if (active) setCategoriesLoading(false);
      }
    }

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchLatestPosts() {
      setPostsLoading(true);
      setPostsError("");

      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select(
            "id, title, slug, excerpt, cover_image_path, category, author, published_at, created_at",
          )
          .eq("is_published", true)
          .order("published_at", {
            ascending: false,
            nullsFirst: false,
          })
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;

        const formattedPosts = (data ?? []).map((post) => ({
          ...post,
          image: post.cover_image_path
            ? supabase.storage
                .from("song-cover")
                .getPublicUrl(post.cover_image_path).data.publicUrl
            : null,
          date: post.published_at || post.created_at,
        }));

        if (active) setLatestPosts(formattedPosts);
      } catch (err) {
        console.error("Error fetching homepage blog posts:", err);

        if (active) {
          setPostsError("We couldn't load the latest news and stories.");
        }
      } finally {
        if (active) setPostsLoading(false);
      }
    }

    fetchLatestPosts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="home">
      {/* Hero */}
      <section className="home__hero">
        <div className="container home__hero-content">
          <p className="home__eyebrow">GOSPEL MUSIC & MEDIA</p>

          <h1>
            Your Sound.
            <br />
            Your Faith.
            <br />
            Your Gospel.
          </h1>

          <p className="home__description">
            Discover gospel songs, lyrics, artists and inspiring Christian music
            from Nigeria and beyond.
          </p>

          <div className="home__actions">
            <Link to="/music" className="button button--primary">
              Explore Music
            </Link>

            <Link to="/lyrics" className="button button--secondary">
              Browse Lyrics
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Songs */}
      <section className="home__section">
        <div className="container">
          <SectionHeading
            eyebrow="LATEST RELEASES"
            title="New Gospel Music"
            description="Discover the latest songs added to Gospelova."
          />

          {songsLoading && (
            <p>
              Loading latest gospel song
              {songsLoading && (
                <LoadingState message="Loading latest gospel songs..." />
              )}
              s...
            </p>
          )}

          {songsError && <p role="alert">{songsError}</p>}

          {!songsLoading && !songsError && latestSongs.length === 0 && (
            <p>No songs have been published yet. Check back soon!</p>
          )}

          {!songsLoading && !songsError && latestSongs.length > 0 && (
            <div className="song-grid">
              {latestSongs.map((song) => {
                const coverUrl = song.cover_image_path
                  ? supabase.storage
                      .from("song-cover")
                      .getPublicUrl(song.cover_image_path).data.publicUrl
                  : null;

                return (
                  <SongCard
                    key={song.id}
                    title={song.title}
                    artist={song.artists?.name ?? "Unknown artist"}
                    image={coverUrl}
                    audioUrl={song.audio_path}
                    slug={song.slug}
                  />
                );
              })}
            </div>
          )}

          <div className="home__section-action">
            <Link to="/music" className="button button--outline">
              View All Music
            </Link>
          </div>
        </div>
      </section>

      {/* Artists */}
      <section className="home__section home__section--muted">
        <div className="container">
          <SectionHeading
            eyebrow="GOSPEL ARTISTS"
            title="Discover Artists"
            description="Explore gospel artists and their music."
          />

          {artistsLoading && (
            <LoadingState message="Loading gospel artists..." />
          )}

          {artistsError && <p role="alert">{artistsError}</p>}

          {!artistsLoading && !artistsError && popularArtists.length === 0 && (
            <p>No artists have been added yet. Check back soon!</p>
          )}

          {!artistsLoading && !artistsError && popularArtists.length > 0 && (
            <div className="artist-grid">
              {popularArtists.map((artist) => (
                <Link
                  key={artist.id}
                  to={`/artists/${artist.slug}`}
                  className="home-artist-link"
                >
                  <ArtistCard name={artist.name} image={artist.image} />
                </Link>
              ))}
            </div>
          )}

          <div className="home__section-action">
            <Link to="/artists" className="button button--outline">
              View All Artists
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="home__section">
        <div className="container">
          <SectionHeading
            eyebrow="EXPLORE"
            title="Browse Categories"
            description="Find gospel music by sound, style and mood."
          />

          {categoriesLoading && (
            <LoadingState message="Loading music categories..." />
          )}

          {categoriesError && <p role="alert">{categoriesError}</p>}

          {!categoriesLoading &&
            !categoriesError &&
            categories.length === 0 && (
              <p>No categories have been added yet. Check back soon!</p>
            )}

          {!categoriesLoading && !categoriesError && categories.length > 0 && (
            <div className="category-grid">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  slug={category.slug}
                  description={category.description}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* News */}
      <section className="home__section home__section--muted">
        <div className="container">
          <SectionHeading
            eyebrow="GOSPEL NEWS"
            title="Latest News & Stories"
            description="Stay connected with gospel music and Christian stories."
          />

          {postsLoading && (
            <LoadingState message="Loading the latest news and stories..." />
          )}

          {postsError && <p role="alert">{postsError}</p>}

          {!postsLoading && !postsError && latestPosts.length === 0 && (
            <p>No articles have been published yet. Check back soon!</p>
          )}

          {!postsLoading && !postsError && latestPosts.length > 0 && (
            <div className="blog-grid">
              {latestPosts.map((post) => (
                <BlogCard
                  key={post.id}
                  title={post.title}
                  excerpt={post.excerpt}
                  image={post.image}
                  date={
                    post.date
                      ? new Date(post.date).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""
                  }
                  slug={post.slug}
                />
              ))}
            </div>
          )}

          <div className="home__section-action">
            <Link to="/blog" className="button button--outline">
              Read All News
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
