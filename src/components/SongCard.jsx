import { Link } from "react-router-dom";

function SongCard({ title, artist, image, slug, audioUrl }) {
  return (
    <article className="song-card">
      <div className="song-card__image-wrapper">
        {image ? (
          <img
            src={image}
            alt={`${title} by ${artist}`}
            className="song-card__image"
          />
        ) : (
          <div className="song-card__placeholder">
            <span>♪</span>
          </div>
        )}

        <button
          type="button"
          className="song-card__play"
          aria-label={`Play ${title}`}
        >
          ▶
        </button>
      </div>

      <div className="song-card__content">
        <h3 className="song-card__title">{title}</h3>

        <p className="song-card__artist">{artist}</p>

        <div className="song-card__actions">
          <Link to={`/music/${slug}`} className="song-card__details">
            View Song
          </Link>

          {audioUrl && (
            <a
              href={audioUrl}
              download
              className="song-card__download"
              aria-label={`Download ${title}`}
            >
              ↓
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default SongCard;
