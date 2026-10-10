import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <h2>Gospelova</h2>
          <p>Your Sound. Your Faith. Your Gospel.</p>
        </div>

        <nav className="footer__links" aria-label="Footer navigation">
          <Link to="/music">Music</Link>
          <Link to="/lyrics">Lyrics</Link>
          <Link to="/artists">Artists</Link>
          <Link to="/blog">Gospel News</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/copyright">Copyright</Link>
        </nav>
      </div>

      <div className="container footer__bottom">
        <p>© {new Date().getFullYear()} Gospelova. All rights reserved.</p>
        <p>
          <Link to="/copyright">Copyright Policy</Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
