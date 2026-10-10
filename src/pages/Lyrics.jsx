import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import "../styles/lyrics.css";
import LoadingState from "../components/LoadingState";
import SEO from "../components/SEO";

function Lyrics() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSong, setSelectedSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLyrics() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("songs")
        .select(
          `
          id,
          title,
          slug,
          lyrics,
          cover_image_path,
          artists ( name, slug )
        `,
        )
        .eq("is_published", true)
        .not("lyrics", "is", null)
        .order("title", { ascending: true });

      if (error) {
        console.error("Failed to load song lyrics:", error);
        setError("We couldn't load lyrics right now. Please try again.");
        setSongs([]);
      } else {
        const songsWithLyrics = (data ?? []).filter((song) =>
          song.lyrics?.trim(),
        );
        setSongs(songsWithLyrics);
      }

      setLoading(false);
    }

    loadLyrics();
  }, []);

  const filteredSongs = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return songs;

    return songs.filter((song) => {
      const title = song.title?.toLowerCase() ?? "";
      const artist = song.artists?.name?.toLowerCase() ?? "";

      return title.includes(term) || artist.includes(term);
    });
  }, [songs, search]);

  function getCoverUrl(path) {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return supabase.storage.from("song-cover").getPublicUrl(path).data
      .publicUrl;
  }

  return (
    <>
      <SEO
        title="Gospel Song Lyrics"
        description="Find gospel song lyrics, explore songs by title or artist, and sing along to inspiring gospel music on Gospelova."
        url="/lyrics"
      />

      <main className="lyrics-page">
        <section className="lyrics-hero">
          <div className="container">
            <p className="lyrics-eyebrow">SING ALONG IN FAITH</p>
            <h1>Gospel Song Lyrics</h1>
            <p>
              Find the words behind your favourite gospel songs and let the
              message inspire you.
            </p>

            <label className="lyrics-search">
              <span className="sr-only">Search by song or artist</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search song title or artist..."
              />
            </label>
          </div>
        </section>

        <section className="container lyrics-content">
          <div className="lyrics-section-heading">
            <div>
              <h2>Explore Lyrics</h2>
              <p>
                {loading
                  ? "Finding published lyrics..."
                  : `${filteredSongs.length} ${
                      filteredSongs.length === 1 ? "song" : "songs"
                    } found`}
              </p>
            </div>
          </div>

          {loading && <LoadingState message="Loading gospel lyrics..." />}

          {!loading && error && (
            <div className="lyrics-feedback lyrics-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredSongs.length === 0 && (
            <div className="lyrics-feedback">
              <h3>
                {search.trim() ? "No matching lyrics" : "Lyrics coming soon"}
              </h3>
              <p>
                {search.trim()
                  ? "Try another song title or artist name."
                  : "Published song lyrics will appear here when available."}
              </p>
            </div>
          )}

          {!loading && !error && filteredSongs.length > 0 && (
            <div className="lyrics-grid">
              {filteredSongs.map((song) => {
                const coverUrl = getCoverUrl(song.cover_image_path);
                const isSelected = selectedSong?.id === song.id;

                return (
                  <article className="lyrics-card" key={song.id}>
                    <div className="lyrics-card-top">
                      {coverUrl ? (
                        <img
                          className="lyrics-cover"
                          src={coverUrl}
                          alt={`${song.title} cover`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="lyrics-cover lyrics-cover-placeholder">
                          ♪
                        </div>
                      )}

                      <div className="lyrics-card-info">
                        <h3>{song.title}</h3>
                        <p>{song.artists?.name || "Gospel Artist"}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="lyrics-view-button"
                      aria-expanded={isSelected}
                      onClick={() => setSelectedSong(isSelected ? null : song)}
                    >
                      {isSelected ? "Hide Lyrics" : "Read Lyrics"}
                    </button>

                    {isSelected && (
                      <div className="lyrics-full-text">
                        <h4>{song.title} — Lyrics</h4>
                        <div>{song.lyrics}</div>
                        <button
                          type="button"
                          className="lyrics-copy-button"
                          onClick={() => {
                            if (navigator.clipboard?.writeText) {
                              navigator.clipboard
                                .writeText(song.lyrics)
                                .catch(() => {
                                  setError(
                                    "Couldn't copy the lyrics. Please select and copy the text manually.",
                                  );
                                });
                            } else {
                              setError(
                                "Copy isn't supported here. Please select and copy the lyrics manually.",
                              );
                            }
                          }}
                        >
                          Copy Lyrics
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default Lyrics;
