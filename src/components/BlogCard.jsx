import { Link } from "react-router-dom";

function BlogCard({ title, excerpt, image, date, slug }) {
  return (
    <article className="blog-card">
      <div className="blog-card__image-wrapper">
        {image ? (
          <img src={image} alt={title} className="blog-card__image" />
        ) : (
          <div className="blog-card__placeholder">
            <span>✦</span>
          </div>
        )}
      </div>

      <div className="blog-card__content">
        {date && <p className="blog-card__date">{date}</p>}

        <h3 className="blog-card__title">{title}</h3>

        {excerpt && <p className="blog-card__excerpt">{excerpt}</p>}

        <Link to={`/blog/${slug}`} className="blog-card__link">
          Read Article →
        </Link>
      </div>
    </article>
  );
}

export default BlogCard;
