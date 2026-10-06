import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="home">
      <div className="container home__content">
        <p className="home__eyebrow">GOSPEL MUSIC & MEDIA</p>

        <h1>
          Your Sound.
          <br />
          Your Faith.
          <br />
          Your Gospel.
        </h1>

        <p className="home__description">
          Discover gospel songs, lyrics, artists and inspiring Christian music
          from Nigeria and beyond.
        </p>

        <div className="home__actions">
          <Link to="/music" className="button button--primary">
            Explore Music
          </Link>

          <Link to="/lyrics" className="button button--secondary">
            Browse Lyrics
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Home;
