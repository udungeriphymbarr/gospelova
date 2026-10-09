import { Link } from "react-router-dom";

import SectionHeading from "../components/SectionHeading";
import SongCard from "../components/SongCard";
import ArtistCard from "../components/ArtistCard";
import CategoryCard from "../components/CategoryCard";
import BlogCard from "../components/BlogCard";

import {
  latestSongs,
  popularArtists,
  categories,
  latestNews,
} from "../utils/homeData";

function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="home__hero">
        <div className="container home__hero-content">
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

      {/* Latest Songs */}
      <section className="home__section">
        <div className="container">
          <SectionHeading
            eyebrow="LATEST RELEASES"
            title="New Gospel Music"
            description="Discover the latest songs added to Gospelova."
          />

          <div className="song-grid">
            {latestSongs.map((song) => (
              <SongCard
                key={song.id}
                title={song.title}
                artist={song.artist}
                image={song.image}
                audioUrl={song.audioUrl}
              />
            ))}
          </div>

          <div className="home__section-action">
            <Link to="/music" className="button button--outline">
              View All Music
            </Link>
          </div>
        </div>
      </section>

      {/* Artists */}
      <section className="home__section home__section--muted">
        <div className="container">
          <SectionHeading
            eyebrow="GOSPEL ARTISTS"
            title="Discover Artists"
            description="Explore gospel artists and their music."
          />

          <div className="artist-grid">
            {popularArtists.map((artist) => (
              <ArtistCard
                key={artist.id}
                name={artist.name}
                image={artist.image}
              />
            ))}
          </div>

          <div className="home__section-action">
            <Link to="/artists" className="button button--outline">
              View All Artists
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="home__section">
        <div className="container">
          <SectionHeading
            eyebrow="EXPLORE"
            title="Browse Categories"
            description="Find gospel music by sound, style and mood."
          />

          <div className="category-grid">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                slug={category.slug}
                description={category.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      {/* News */}
      <section className="home__section home__section--muted">
        <div className="container">
          <SectionHeading
            eyebrow="GOSPEL NEWS"
            title="Latest News & Stories"
            description="Stay connected with gospel music and Christian stories."
          />

          <div className="blog-grid">
            {latestNews.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                excerpt={post.excerpt}
                image={post.image}
                date={post.date}
                slug={post.slug}
              />
            ))}
          </div>

          <div className="home__section-action">
            <Link to="/blog" className="button button--outline">
              Read All News
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
