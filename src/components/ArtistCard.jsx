function ArtistCard({ name, image }) {
  return (
    <article className="artist-card">
      <div className="artist-card__image-wrapper">
        <img src={image} alt={name} className="artist-card__image" />
      </div>

      <div className="artist-card__content">
        <h3 className="artist-card__name">{name}</h3>

        <p className="artist-card__label">Gospel Artist</p>
      </div>
    </article>
  );
}

export default ArtistCard;
