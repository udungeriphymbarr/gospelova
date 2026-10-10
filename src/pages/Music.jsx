import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import LoadingState from "../components/LoadingState";
import SEO from "../components/SEO";

function Music() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchSongs() {
      const { data, error } = await supabase
        .from("songs")
        .select(
          `
          id,
          title,
          slug,
          description,
          cover_image_path,
          created_at,
          artists ( name ),
          categories ( name )
        `,
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Error fetching songs:", error);
        setError("We couldn't load the music. Please try again later.");
      } else {
        setSongs(data ?? []);
      }

      setLoading(false);
    }

    fetchSongs();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SEO
        title="Discover Gospel Music"
        description="Explore gospel songs, discover inspiring artists, and download gospel music to accompany your faith journey on Gospelova."
        url="/music"
      />

      <section className="music-page">
        <div className="container">
          <header className="music-page__header">
            <p className="music-page__eyebrow">
              YOUR SOUND. YOUR FAITH. YOUR GOSPEL.
            </p>

            <h1 className="music-page__title">Discover Gospel Music</h1>

            <p className="music-page__description">
              Explore gospel songs, discover inspiring artists, and find music
              to accompany your faith journey.
            </p>
          </header>

          {loading && <LoadingState message="Loading gospel music..." />}

          {error && (
            <p
              className="music-page__status music-page__status--error"
              role="alert"
            >
              {error}
            </p>
          )}

          {!loading && !error && songs.length === 0 && (
            <p className="music-page__status">
              No songs are available yet. Check back soon for new gospel music!
            </p>
          )}

          {!loading && !error && songs.length > 0 && (
            <div className="music-page__grid">
              {songs.map((song) => {
                const coverUrl = song.cover_image_path
                  ? supabase.storage
                      .from("song-cover")
                      .getPublicUrl(song.cover_image_path).data.publicUrl
                  : null;

                return (
                  <article className="music-page__card" key={song.id}>
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`${song.title} cover`}
                        className="music-page__cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="music-page__cover-placeholder"
                        aria-label="No cover art available"
                      >
                        <span>♪</span>
                      </div>
                    )}

                    {song.categories?.name && (
                      <span className="music-page__category">
                        {song.categories.name}
                      </span>
                    )}

                    <h2 className="music-page__song-title">{song.title}</h2>

                    <p className="music-page__artist">
                      By {song.artists?.name ?? "Unknown artist"}
                    </p>

                    {song.description && (
                      <p className="music-page__description">
                        {song.description}
                      </p>
                    )}

                    <div className="music-page__actions">
                      <Link
                        to={`/music/${song.slug}`}
                        className="music-page__view-link"
                      >
                        View Song
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Music;
