import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/music.css";
import SEO from "../components/SEO";

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;

    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];

      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );

      diagonal = above;
    }
  }

  return previous[b.length];
}

function isSimilar(query, target) {
  if (!query || !target) return false;
  if (target.includes(query) || query.includes(target)) return true;

  const queryWords = query.split(" ");
  const targetWords = target.split(" ");

  // Match individual words, including small spelling mistakes.
  return queryWords.some((queryWord) =>
    targetWords.some((targetWord) => {
      if (queryWord.length < 4 || targetWord.length < 4) return false;

      const distance = editDistance(queryWord, targetWord);
      const allowedMistakes = queryWord.length >= 8 ? 2 : 1;

      return (
        distance <= allowedMistakes &&
        Math.abs(queryWord.length - targetWord.length) <= allowedMistakes
      );
    }),
  );
}

function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event) {
    event.preventDefault();

    const query = normalizeText(searchTerm);

    if (!query) {
      setResults([]);
      setHasSearched(false);
      setError("Please enter a song title or artist name.");
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const { data, error: fetchError } = await supabase
        .from("songs")
        .select(
          `
          id,
          title,
          slug,
          audio_path,
          cover_image_path,
          artists (
            name
          )
        `,
        )
        .eq("is_published", true)
        .limit(1000);

      if (fetchError) throw fetchError;

      const songs = data || [];

      const matches = songs.filter((song) => {
        const title = normalizeText(song.title);
        const artistName = normalizeText(song.artists?.name || "");

        return (
          title.includes(query) ||
          artistName.includes(query) ||
          isSimilar(query, title) ||
          isSimilar(query, artistName)
        );
      });

      setResults(matches);
    } catch (searchError) {
      console.error("Gospelova search error:", searchError);
      setError("We couldn't complete your search. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SEO
        title="Search Gospel Music"
        description="Search Gospelova for gospel songs by title or artist. Discover gospel music, explore song details, and find music to download."
        url="/search"
        noIndex={true}
      />

      <section className="music-page gospelova-search-page">
        <div className="container">
          <header className="music-page__header">
            <p className="music-page__eyebrow">DISCOVER GOSPEL MUSIC</p>

            <h1 className="music-page__title">Search Gospelova</h1>

            <p className="music-page__description">
              Find your favourite gospel songs by title or artist. Even if you
              make a small spelling mistake, we'll try to find a match.
            </p>
          </header>

          <form className="gospelova-search-form" onSubmit={handleSearch}>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setError("");
              }}
              placeholder="Enter a song title or artist name..."
              aria-label="Search songs or artists"
            />

            <button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {error && (
            <p className="music-page__status" role="alert">
              {error}
            </p>
          )}

          {loading && (
            <p className="music-page__status" role="status">
              Searching Gospelova...
            </p>
          )}

          {!loading && hasSearched && !error && (
            <>
              <h2 className="gospelova-search-results-title">
                {results.length > 0
                  ? `${results.length} result${results.length === 1 ? "" : "s"} found`
                  : "No results found"}
              </h2>

              {results.length === 0 ? (
                <div className="music-page__status">
                  We couldn't find a song or artist matching{" "}
                  <strong>{searchTerm}</strong>. Try another spelling or search
                  for a different artist.
                </div>
              ) : (
                <div className="music-page__grid">
                  {results.map((song) => {
                    const coverUrl = song.cover_image_path
                      ? supabase.storage
                          .from("song-cover")
                          .getPublicUrl(song.cover_image_path).data.publicUrl
                      : null;

                    return (
                      <article className="music-page__card" key={song.id}>
                        {coverUrl ? (
                          <img
                            className="music-page__cover"
                            src={coverUrl}
                            alt={`${song.title} cover`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="music-page__cover music-page__cover-placeholder">
                            ♪
                          </div>
                        )}

                        <h3 className="music-page__song-title">{song.title}</h3>

                        <p className="music-page__artist">
                          {song.artists?.name || "Unknown artist"}
                        </p>

                        <div className="music-page__actions">
                          <Link
                            className="music-page__view-link"
                            to={`/music/${song.slug}`}
                          >
                            View Song
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

export default Search;
