import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AudioPlayer from "../components/AudioPlayer";

function SongDetails() {
  const { slug } = useParams();

  const [song, setSong] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchSong() {
      setLoading(true);
      setError("");
      setSong(null);
      setAudioUrl("");
      setDownloadUrl("");

      const { data, error: fetchError } = await supabase
        .from("songs")
        .select(
          `
          id,
          title,
          slug,
          description,
          lyrics,
          audio_path,
          cover_image_path,
          release_date,
          created_at,
          artists ( name ),
          categories ( name )
        `,
        )
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError) {
        console.error("Error fetching song:", fetchError);
        setError("We couldn't load this song. Please try again later.");
        setLoading(false);
        return;
      }

      if (!data) {
        setLoading(false);
        return;
      }

      setSong(data);

      if (data.audio_path) {
        const [playerResult, downloadResult] = await Promise.all([
          supabase.storage
            .from("song-audio")
            .createSignedUrl(data.audio_path, 3600),

          supabase.storage
            .from("song-audio")
            .createSignedUrl(data.audio_path, 3600, {
              download: true,
            }),
        ]);

        if (cancelled) return;

        if (playerResult.error || downloadResult.error) {
          console.error(
            "Error creating audio URLs:",
            playerResult.error || downloadResult.error,
          );
        } else {
          setAudioUrl(playerResult.data.signedUrl);
          setDownloadUrl(downloadResult.data.signedUrl);
        }
      }

      setLoading(false);
    }

    fetchSong();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="page-section">
        <div className="container">
          <p>Loading song details...</p>
        </div>
      </section>
    );
  }

  if (error || !song) {
    return (
      <section className="page-section">
        <div className="container">
          <h1>{error ? "Unable to Load Song" : "Song Not Found"}</h1>
          <p>
            {error ||
              "The song you're looking for doesn't exist or isn't published."}
          </p>
          <Link to="/music" className="button button--primary">
            Back to Music
          </Link>
        </div>
      </section>
    );
  }

  const coverUrl = song.cover_image_path
    ? supabase.storage.from("song-cover").getPublicUrl(song.cover_image_path)
        .data.publicUrl
    : null;

  const releaseDate = song.release_date
    ? new Date(`${song.release_date}T00:00:00`).toLocaleDateString("en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const artist = song.artists?.name ?? "Unknown artist";
  const category = song.categories?.name ?? "Gospel Music";

  return (
    <section className="song-details">
      <div className="container">
        <Link to="/music" className="song-details__back">
          ← Back to Music
        </Link>

        <div className="song-details__header">
          <div className="song-details__cover">
            {coverUrl ? (
              <img src={coverUrl} alt={`${song.title} by ${artist}`} />
            ) : (
              <div className="song-details__placeholder">
                <span>♪</span>
              </div>
            )}
          </div>

          <div className="song-details__info">
            <p className="song-details__category">{category}</p>

            <h1>{song.title}</h1>

            <p className="song-details__artist">By {artist}</p>

            {releaseDate && (
              <p className="song-details__date">Released {releaseDate}</p>
            )}

            {song.description && (
              <p className="song-details__description">{song.description}</p>
            )}

            <div className="song-details__actions">
              {downloadUrl && (
                <a href={downloadUrl} className="button button--outline">
                  ↓ Download
                </a>
              )}
            </div>

            {audioUrl && <AudioPlayer audioUrl={audioUrl} title={song.title} />}

            {song.audio_path && !audioUrl && (
              <p>Audio is temporarily unavailable. Please try again later.</p>
            )}
          </div>
        </div>

        <div className="song-details__lyrics">
          <h2>Lyrics</h2>

          <div className="song-details__lyrics-content">
            {song.lyrics || "Lyrics are not available yet."}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SongDetails;
