function SongCard({ title, artist, image }) {
  return (
    <article className="song-card">
      <div className="song-card__image-wrapper">
        <img
          src={image}
          alt={`${title} by ${artist}`}
          className="song-card__image"
        />

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
      </div>
    </article>
  );
}

export default SongCard;
