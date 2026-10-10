import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/artists.css";
import LoadingState from "../components/LoadingState";
import SEO from "../components/SEO";

function Artists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadArtists() {
      setLoading(true);
      setError("");

      try {
        const { data, error: queryError } = await supabase
          .from("artists")
          .select("id, name, slug, bio, image_path")
          .order("name", { ascending: true });

        if (queryError) throw queryError;

        const formattedArtists = (data ?? []).map((artist) => ({
          ...artist,
          imageUrl: artist.image_path
            ? supabase.storage
                .from("song-cover")
                .getPublicUrl(artist.image_path).data.publicUrl
            : null,
        }));

        if (active) {
          setArtists(formattedArtists);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load artists.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadArtists();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SEO
        title="Discover Gospel Artists"
        description="Discover gospel singers, musicians, and ministers inspiring faith through gospel music. Explore artists and their music on Gospelova."
        url="/artists"
      />

      <section className="page artists-page">
        <div className="container">
          <header className="artists-header">
            <p className="artists-eyebrow">GOSPELOVA MUSIC</p>
            <h1>Discover Gospel Artists</h1>
            <p>
              Discover the voices, ministries, and musicians inspiring faith
              through gospel music.
            </p>
          </header>

          {loading && <LoadingState message="Loading gospel artists..." />}

          {error && (
            <div className="artists-message artists-error" role="alert">
              <p>We couldn't load the artists right now.</p>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && artists.length === 0 && (
            <div className="artists-message">
              <h2>No artists yet</h2>
              <p>
                We're preparing our artist directory. Please check back soon.
              </p>
            </div>
          )}

          {!loading && !error && artists.length > 0 && (
            <div className="public-artists-grid">
              {artists.map((artist) => (
                <article className="public-artist-card" key={artist.id}>
                  {artist.imageUrl ? (
                    <img
                      className="public-artist-image"
                      src={artist.imageUrl}
                      alt={`${artist.name}`}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="public-artist-placeholder"
                      aria-label="No artist photo available"
                    >
                      <span>{artist.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}

                  <div className="public-artist-content">
                    <h2>{artist.name}</h2>

                    <p>
                      {artist.bio
                        ? artist.bio.length > 150
                          ? `${artist.bio.slice(0, 150).trim()}...`
                          : artist.bio
                        : "Discover music and ministry from this gospel artist."}
                    </p>

                    <Link
                      to={`/artists/${artist.slug}`}
                      className="public-artist-link"
                    >
                      Explore Songs
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
export default Artists;
