import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/artists.css";
import LoadingState from "../components/LoadingState";

function ArtistDetails() {
  const { slug } = useParams();

  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadArtistDetails() {
      setLoading(true);
      setError("");
      setArtist(null);
      setSongs([]);

      try {
        const { data: artistData, error: artistError } = await supabase
          .from("artists")
          .select("id, name, slug, bio, image_path")
          .eq("slug", slug)
          .maybeSingle();

        if (artistError) throw artistError;

        if (!artistData) {
          if (active) setError("We couldn't find this artist.");
          return;
        }

        const { data: songData, error: songError } = await supabase
          .from("songs")
          .select(
            `
            id,
            title,
            slug,
            cover_image_path,
            audio_path,
            release_date,
            artists ( name )
          `,
          )
          .eq("artist_id", artistData.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (songError) throw songError;

        const artistImage = artistData.image_path
          ? supabase.storage
              .from("song-cover")
              .getPublicUrl(artistData.image_path).data.publicUrl
          : null;

        const formattedSongs = (songData ?? []).map((song) => ({
          ...song,
          coverUrl: song.cover_image_path
            ? supabase.storage
                .from("song-cover")
                .getPublicUrl(song.cover_image_path).data.publicUrl
            : null,
        }));

        if (active) {
          setArtist({ ...artistData, imageUrl: artistImage });
          setSongs(formattedSongs);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load this artist.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadArtistDetails();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="page artists-page">
        <div className="container">
          <LoadingState message="Loading artist profile..." fullPage />
        </div>
      </section>
    );
  }

  if (error || !artist) {
    return (
      <section className="page artists-page">
        <div className="container">
          <div className="artists-message">
            <h1>Artist unavailable</h1>
            <p>{error || "This artist could not be found."}</p>
            <Link to="/artists" className="public-artist-link">
              Back to Artists
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page artists-page">
      <div className="container">
        <Link to="/artists" className="artist-back-link">
          ← All Artists
        </Link>

        <header className="artist-detail-header">
          {artist.imageUrl ? (
            <img
              className="artist-detail-image"
              src={artist.imageUrl}
              alt={artist.name}
            />
          ) : (
            <div className="artist-detail-placeholder" aria-hidden="true">
              {artist.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="artist-detail-info">
            <p className="artists-eyebrow">GOSPELOVA ARTIST</p>
            <h1>{artist.name}</h1>
            <p className="artist-detail-bio">
              {artist.bio ||
                "Discover music and ministry from this gospel artist."}
            </p>
            <p className="artist-song-count">
              {songs.length}{" "}
              {songs.length === 1 ? "published song" : "published songs"}
            </p>
          </div>
        </header>

        <section className="artist-songs-section">
          <div className="artist-songs-heading">
            <div>
              <p className="artists-eyebrow">THE MUSIC</p>
              <h2>Songs by {artist.name}</h2>
            </div>
          </div>

          {songs.length === 0 ? (
            <div className="artists-message">
              <h3>No published songs yet</h3>
              <p>Check back later for music from this artist.</p>
            </div>
          ) : (
            <div className="public-artists-grid artist-songs-grid">
              {songs.map((song) => (
                <article
                  className="public-artist-card artist-song-card"
                  key={song.id}
                >
                  <Link
                    to={`/music/${song.slug}`}
                    className="artist-song-cover-link"
                    aria-label={`View ${song.title}`}
                  >
                    {song.coverUrl ? (
                      <img
                        className="artist-song-cover"
                        src={song.coverUrl}
                        alt={`${song.title} cover art`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="artist-song-cover-placeholder">
                        Gospelova
                      </div>
                    )}
                  </Link>

                  <div className="public-artist-content">
                    <h3>
                      <Link
                        to={`/music/${song.slug}`}
                        className="artist-song-title"
                      >
                        {song.title}
                      </Link>
                    </h3>
                    <p>{song.artists?.name || artist.name}</p>
                    <Link
                      to={`/music/${song.slug}`}
                      className="public-artist-link"
                    >
                      Listen & Download
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default ArtistDetails;
