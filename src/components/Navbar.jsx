import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo" onClick={closeMenu}>
          <span className="navbar__logo-main">Gospelova</span>

          <span className="navbar__logo-tagline">
            Your Sound. Your Faith. Your Gospel.
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="navbar__nav navbar__nav--desktop"
          aria-label="Main navigation"
        >
          <Link to="/">Home</Link>
          <Link to="/music">Music</Link>
          <Link to="/lyrics">Lyrics</Link>
          <Link to="/artists">Artists</Link>
          <Link to="/blog">Gospel News</Link>
          <Link to="/search">Search</Link>
        </nav>

        <div className="navbar__actions">
          {/* Dedicated Search Icon */}
          <Link
            to="/search"
            className="navbar__search-button"
            aria-label="Search Gospelova"
            title="Search"
            onClick={closeMenu}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="navbar__menu-button"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav
        className={`navbar__mobile ${menuOpen ? "navbar__mobile--open" : ""}`}
        aria-label="Mobile navigation"
      >
        <Link to="/" onClick={closeMenu}>
          Home
        </Link>

        <Link to="/music" onClick={closeMenu}>
          Music
        </Link>

        <Link to="/lyrics" onClick={closeMenu}>
          Lyrics
        </Link>

        <Link to="/artists" onClick={closeMenu}>
          Artists
        </Link>

        <Link to="/blog" onClick={closeMenu}>
          Gospel News
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;
