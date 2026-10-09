import { Link, useParams } from "react-router-dom";
import { songDetails } from "../utils/homeData";
import AudioPlayer from "../components/AudioPlayer";

function SongDetails() {
  const { slug } = useParams();

  const song = songDetails.find((item) => item.slug === slug);

  if (!song) {
    return (
      <section className="page-section">
        <div className="container">
          <h1>Song Not Found</h1>
          <p>The song you are looking for does not exist.</p>
          <Link to="/music" className="button button--primary">
            Back to Music
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="song-details">
      <div className="container">
        <Link to="/music" className="song-details__back">
          ← Back to Music
        </Link>

        <div className="song-details__header">
          <div className="song-details__cover">
            {song.image ? (
              <img src={song.image} alt={`${song.title} by ${song.artist}`} />
            ) : (
              <div className="song-details__placeholder">
                <span>♪</span>
              </div>
            )}
          </div>

          <div className="song-details__info">
            <p className="song-details__category">{song.category}</p>

            <h1>{song.title}</h1>

            <p className="song-details__artist">By {song.artist}</p>

            <p className="song-details__date">Released {song.releaseDate}</p>

            <p className="song-details__description">{song.description}</p>

            <div className="song-details__actions">
              {song.audioUrl && (
                <a
                  href={song.audioUrl}
                  download
                  className="button button--outline"
                >
                  ↓ Download
                </a>
              )}
            </div>

            {song.audioUrl && (
              <AudioPlayer audioUrl={song.audioUrl} title={song.title} />
            )}
          </div>
        </div>

        <div className="song-details__lyrics">
          <h2>Lyrics</h2>

          <div className="song-details__lyrics-content">{song.lyrics}</div>
        </div>
      </div>
    </section>
  );
}

export default SongDetails;
