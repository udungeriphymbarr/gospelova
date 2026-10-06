import { Link } from "react-router-dom";

function CategoryCard({ name, description, slug }) {
  return (
    <Link to={`/categories/${slug}`} className="category-card">
      <div className="category-card__content">
        <span className="category-card__icon">♪</span>

        <h3 className="category-card__name">{name}</h3>

        {description && (
          <p className="category-card__description">{description}</p>
        )}

        <span className="category-card__link">Explore →</span>
      </div>
    </Link>
  );
}

export default CategoryCard;
