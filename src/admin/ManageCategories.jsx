import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("categories")
      .select("id, name, slug, description, created_at")
      .order("name", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setCategories([]);
    } else {
      setCategories(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function deleteCategory(category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\n` +
        "Songs assigned to this category will remain in Gospelova, " +
        "but their category assignment will be removed. " +
        "This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeletingCategoryId(category.id);
    setError("");
    setActionMessage("");

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
        throw new Error("You do not have permission to delete categories.");
      }

      const { data: currentCategory, error: fetchError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("id", category.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!currentCategory) {
        throw new Error("This category no longer exists. Refresh the page.");
      }

      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (deleteError) throw deleteError;

      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );

      setActionMessage(`"${currentCategory.name}" was deleted.`);
    } catch (err) {
      setError(err.message || "Unable to delete category.");
    } finally {
      setDeletingCategoryId(null);
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-song-library-heading">
        <div>
          <h1>Manage Categories</h1>
          <p>Organize the music categories available on Gospelova.</p>
        </div>

        <div className="admin-song-header-actions">
          <Link to="/admin" className="admin-secondary-link">
            Back to Dashboard
          </Link>

          <Link to="/admin/categories/new" className="admin-action-button">
            + Add Category
          </Link>

          <button
            type="button"
            className="admin-action-button"
            onClick={loadCategories}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      {actionMessage && (
        <p className="admin-success" role="status">
          {actionMessage}
        </p>
      )}

      {loading ? (
        <p>Loading categories...</p>
      ) : categories.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No categories found</h2>
          <p>Your music categories will appear here after you add them.</p>
        </div>
      ) : (
        <div className="admin-song-table-wrap">
          <table className="admin-song-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>
                    {category.description
                      ? `${category.description.slice(0, 90)}${
                          category.description.length > 90 ? "..." : ""
                        }`
                      : "No description"}
                  </td>
                  <td>{new Date(category.created_at).toLocaleDateString()}</td>

                  <td>
                    <div className="admin-song-row-actions">
                      <Link
                        to={`/admin/categories/edit/${category.id}`}
                        className="admin-edit-button"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        className="admin-delete-button"
                        disabled={deletingCategoryId === category.id}
                        onClick={() => deleteCategory(category)}
                      >
                        {deletingCategoryId === category.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default ManageCategories;
