import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AudioPlayer from "../components/AudioPlayer";
import LoadingState from "../components/LoadingState";
import SEO from "../components/SEO";

function SongDetails() {
  const { slug } = useParams();

  const [song, setSong] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [relatedSongs, setRelatedSongs] = useState([]);

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

      // Fetch other published songs for recommendations
      const { data: recommendations, error: recommendationsError } =
        await supabase
          .from("songs")
          .select(
            `
      id,
      title,
      slug,
      cover_image_path,
      artists ( name ),
      categories ( name )
    `,
          )
          .eq("is_published", true)
          .neq("id", data.id)
          .order("created_at", { ascending: false })
          .limit(4);

      if (cancelled) return;

      if (recommendationsError) {
        console.error(
          "Error fetching recommended songs:",
          recommendationsError,
        );
        setRelatedSongs([]);
      } else {
        setRelatedSongs(recommendations ?? []);
      }

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

  async function copySongLink() {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setShareNotice("Song link copied successfully!");
    } catch {
      setShareNotice(
        "Couldn't copy automatically. Please copy the page URL from your browser.",
      );
    }
  }

  async function shareSong() {
    const url = window.location.href;
    const artist = song.artists?.name ?? "Unknown artist";

    const shareData = {
      title: `${song.title} | Gospelova`,
      text: `Listen to ${song.title} by ${artist} on Gospelova.`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          await copySongLink();
        }
      }
    } else {
      await copySongLink();
    }
  }

  function shareToWhatsApp() {
    const url = window.location.href;
    const artist = song.artists?.name ?? "Unknown artist";

    const message = `Listen to "${song.title}" by ${artist} on Gospelova!\n\n${url}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <section className="page-section">
        <div className="container">
          <LoadingState message="Loading song details..." fullPage />
        </div>
      </section>
    );
  }

  if (error || !song) {
    return (
      <section className="page-section song-state-page">
        <div className="container">
          <h1 className="song-state-page__title">
            {error ? "Unable to Load Song" : "Song Not Found"}
          </h1>

          <p className="song-state-page__message">
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

  const seoDescription =
    song.description?.trim() ||
    `Discover ${song.title} by ${artist} on Gospelova. Listen to the song, download gospel music, and explore the lyrics.`;

  return (
    <>
      <SEO
        title={`${song.title} by ${artist}`}
        description={seoDescription}
        image={coverUrl || undefined}
        url={`/music/${song.slug}`}
        type="music.song"
      />

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
                    <svg
                      viewBox="0 0 24 24"
                      width="19"
                      height="19"
                      aria-hidden="true"
                      style={{ verticalAlign: "middle", marginRight: "6px" }}
                    >
                      <path
                        d="M12 3v12m-5-5 5 5 5-5M5 19h14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Download
                  </a>
                )}
              </div>

              {audioUrl && (
                <AudioPlayer audioUrl={audioUrl} title={song.title} />
              )}

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

          {/* Share actions after the lyrics */}
          <section
            className="song-share-section"
            aria-labelledby="song-share-title"
          >
            <h2 id="song-share-title">Enjoy this song? Share it!</h2>

            <p>Help someone discover gospel music that inspires their faith.</p>

            <div className="song-details__actions">
              <button
                type="button"
                className="song-action"
                onClick={copySongLink}
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
                onClick={shareSong}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="m8.7 10.5 6.6-4m-6.6 9 6.6 4" />
                </svg>
                <span>Share Song</span>
              </button>

              <button
                type="button"
                className="song-action song-action--whatsapp"
                onClick={shareToWhatsApp}
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
          </section>

          {/* Recommended songs */}
          {relatedSongs.length > 0 && (
            <section className="song-recommendations">
              <h2>You might also like</h2>
              <p>Discover more gospel music on Gospelova.</p>

              <div className="song-recommendations__grid">
                {relatedSongs.map((relatedSong) => {
                  const relatedCover = relatedSong.cover_image_path
                    ? supabase.storage
                        .from("song-cover")
                        .getPublicUrl(relatedSong.cover_image_path).data
                        .publicUrl
                    : null;

                  return (
                    <article
                      className="song-recommendations__card"
                      key={relatedSong.id}
                    >
                      <Link
                        to={`/music/${relatedSong.slug}`}
                        className="song-recommendations__link"
                      >
                        {relatedCover ? (
                          <img
                            src={relatedCover}
                            alt={`${relatedSong.title} cover`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="song-recommendations__placeholder">
                            ♪
                          </div>
                        )}

                        <div className="song-recommendations__info">
                          <h3>{relatedSong.title}</h3>
                          <p>
                            By {relatedSong.artists?.name ?? "Unknown artist"}
                          </p>

                          {relatedSong.categories?.name && (
                            <span>{relatedSong.categories.name}</span>
                          )}
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </section>
    </>
  );
}

export default SongDetails;
