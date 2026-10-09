import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

function EditCategory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCategory() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("categories")
        .select("id, name, description")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;

      if (queryError || !data) {
        setError(queryError?.message || "Category not found.");
      } else {
        setName(data.name || "");
        setDescription(data.description || "");
      }

      setLoading(false);
    }

    loadCategory();

    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);

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
        throw new Error("You do not have permission to edit categories.");
      }

      const { error: updateError } = await supabase
        .from("categories")
        .update({
          name: trimmedName,
          description: description.trim() || null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      setMessage("Category updated successfully!");
      setTimeout(() => navigate("/admin/categories"), 1000);
    } catch (err) {
      setError(err.message || "Unable to update category.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <p>Loading category details...</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-song-library-heading">
        <div>
          <h1>Edit Category</h1>
          <p>Update the category name or description.</p>
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
          <label htmlFor="edit-category-name">Category Name *</label>
          <input
            id="edit-category-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="edit-category-description">Description</label>
          <textarea
            id="edit-category-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            maxLength={2000}
          />
        </div>

        <button type="submit" className="admin-action-button" disabled={saving}>
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </main>
  );
}

export default EditCategory;
