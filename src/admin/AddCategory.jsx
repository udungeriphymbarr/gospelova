import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

function AddCategory() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function createSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function makeUniqueSlug(baseSlug) {
    let slug = baseSlug;
    let count = 2;

    while (true) {
      const { data, error: slugError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugError) throw slugError;
      if (!data) return slug;

      slug = `${baseSlug}-${count}`;
      count += 1;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a category name.");
      return;
    }

    setLoading(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Please log in to your admin account.");
      }

      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (adminError || !admin) {
        throw new Error("You do not have permission to add categories.");
      }

      const baseSlug = createSlug(trimmedName);

      if (!baseSlug) {
        throw new Error("Please enter a valid category name.");
      }

      const slug = await makeUniqueSlug(baseSlug);

      const { error: insertError } = await supabase.from("categories").insert({
        name: trimmedName,
        slug,
        description: description.trim() || null,
      });

      if (insertError) throw insertError;

      setMessage("Category added successfully!");
      setName("");
      setDescription("");

      setTimeout(() => navigate("/admin/categories"), 1000);
    } catch (err) {
      setError(err.message || "Unable to add category.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-song-library-heading">
        <div>
          <h1>Add Category</h1>
          <p>Create a category for Gospelova's music library.</p>
        </div>

        <Link to="/admin/categories" className="admin-secondary-link">
          Back to Categories
        </Link>
      </div>

      {message && (
        <p className="admin-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <form className="admin-artist-form" onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label htmlFor="category-name">Category Name *</label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Praise & Worship"
            maxLength={120}
            required
          />
          <small>The URL slug will be generated automatically.</small>
        </div>

        <div className="admin-form-group">
          <label htmlFor="category-description">Description</label>
          <textarea
            id="category-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the songs that belong in this category..."
            rows={5}
            maxLength={2000}
          />
        </div>

        <button
          type="submit"
          className="admin-action-button"
          disabled={loading}
        >
          {loading ? "Adding Category..." : "Add Category"}
        </button>
      </form>
    </main>
  );
}

export default AddCategory;
