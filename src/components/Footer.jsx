function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <h2>Gospelova</h2>
          <p>Your Sound. Your Faith. Your Gospel.</p>
        </div>

        <div className="footer__links">
          <a href="/music">Music</a>
          <a href="/lyrics">Lyrics</a>
          <a href="/artists">Artists</a>
          <a href="/blog">Gospel News</a>
          <a href="/contact">Contact</a>
        </div>
      </div>

      <div className="container footer__bottom">
        <p>© {new Date().getFullYear()} Gospelova. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
