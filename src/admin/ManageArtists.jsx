import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

function ManageArtists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deletingArtistId, setDeletingArtistId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const loadArtists = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("artists")
      .select("id, name, slug, bio, image_path, created_at")
      .order("name", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setArtists([]);
    } else {
      setArtists(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadArtists();
  }, [loadArtists]);

  async function deleteArtist(artist) {
    const confirmed = window.confirm(
      `Delete "${artist.name}"?\n\n` +
        "Songs linked to this artist will remain in Gospelova, " +
        "but their artist assignment will be removed. " +
        "This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeletingArtistId(artist.id);
    setError("");
    setActionMessage("");

    try {
      // Confirm that the current session belongs to an admin.
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
        throw new Error("You do not have permission to delete artists.");
      }

      // Fetch the latest photo path before deleting the artist.
      const { data: currentArtist, error: fetchError } = await supabase
        .from("artists")
        .select("id, name, image_path")
        .eq("id", artist.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!currentArtist) {
        throw new Error("This artist no longer exists. Refresh the page.");
      }

      // Delete the database record first.
      const { error: deleteError } = await supabase
        .from("artists")
        .delete()
        .eq("id", artist.id);

      if (deleteError) throw deleteError;

      // Remove the artist from the UI immediately.
      setArtists((current) => current.filter((item) => item.id !== artist.id));

      setActionMessage(`"${currentArtist.name}" was deleted.`);

      // Clean up the photo only after the database deletion succeeds.
      if (currentArtist.image_path) {
        const { error: imageError } = await supabase.storage
          .from("song-cover")
          .remove([currentArtist.image_path]);

        if (imageError) {
          console.error("Artist photo cleanup failed:", imageError);
          setActionMessage(
            `Artist deleted, but the photo could not be removed: ${imageError.message}`,
          );
        }
      }
    } catch (err) {
      setError(err.message || "Unable to delete artist.");
    } finally {
      setDeletingArtistId(null);
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-song-library-heading">
        <div>
          <h1>Manage Artists</h1>
          <p>View and manage the artists featured on Gospelova.</p>
        </div>

        <div className="admin-song-header-actions">
          <Link to="/admin" className="admin-secondary-link">
            Back to Dashboard
          </Link>

          <Link to="/admin/artists/new" className="admin-action-button">
            + Add Artist
          </Link>

          <button
            type="button"
            className="admin-action-button"
            onClick={loadArtists}
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
        <p>Loading artists...</p>
      ) : artists.length === 0 ? (
        <div className="admin-empty-state">
          <h2>No artists found</h2>
          <p>
            Artists you add will appear here. You can start by adding your first
            artist.
          </p>
        </div>
      ) : (
        <div className="admin-song-table-wrap">
          <table className="admin-song-table">
            <thead>
              <tr>
                <th>Artist</th>
                <th>Slug</th>
                <th>Biography</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {artists.map((artist) => (
                <tr key={artist.id}>
                  <td>{artist.name}</td>
                  <td>{artist.slug}</td>
                  <td>
                    {artist.bio
                      ? `${artist.bio.slice(0, 90)}${
                          artist.bio.length > 90 ? "..." : ""
                        }`
                      : "No biography"}
                  </td>
                  <td>{new Date(artist.created_at).toLocaleDateString()}</td>

                  <td>
                    <div className="admin-song-row-actions">
                      <Link
                        to={`/admin/artists/edit/${artist.id}`}
                        className="admin-edit-button"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        className="admin-delete-button"
                        disabled={deletingArtistId === artist.id}
                        onClick={() => deleteArtist(artist)}
                      >
                        {deletingArtistId === artist.id
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

export default ManageArtists;
