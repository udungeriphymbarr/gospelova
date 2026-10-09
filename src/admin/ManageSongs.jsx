import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

function ManageSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingSongId, setUpdatingSongId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletingSongId, setDeletingSongId] = useState(null);

  const loadSongs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("songs")
        .select(
          `
    id,
    title,
    slug,
    is_published,
    created_at,
    artists ( name ),
    categories ( name )
  `,
        )
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setSongs(data ?? []);
    } catch (err) {
      setError(err.message || "Unable to load songs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  async function togglePublish(song) {
    setUpdatingSongId(song.id);
    setActionMessage("");
    setActionError("");

    try {
      const nextStatus = !song.is_published;

      const { error: updateError } = await supabase
        .from("songs")
        .update({ is_published: nextStatus })
        .eq("id", song.id);

      if (updateError) throw updateError;

      await loadSongs();

      setActionMessage(
        `"${song.title}" is now ${nextStatus ? "published" : "unpublished"}.`,
      );
    } catch (err) {
      setActionError(err.message || "Unable to update publication status.");
    } finally {
      setUpdatingSongId(null);
    }
  }

  async function deleteSong(song) {
    const confirmed = window.confirm(
      `Permanently delete "${song.title}"? This will remove the song record, audio file, and cover image. This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingSongId(song.id);
    setActionMessage("");
    setActionError("");

    try {
      // 1. Get the song's current storage paths.
      const { data: currentSong, error: lookupError } = await supabase
        .from("songs")
        .select("id, title, audio_path, cover_image_path")
        .eq("id", song.id)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (!currentSong) {
        throw new Error("This song could not be found.");
      }

      // 2. Delete the database record first.
      const { error: deleteError } = await supabase
        .from("songs")
        .delete()
        .eq("id", song.id);

      if (deleteError) throw deleteError;

      // Remove the deleted song from the displayed table.
      setSongs((currentSongs) =>
        currentSongs.filter((item) => item.id !== song.id),
      );

      // 3. Remove the associated files from Supabase Storage.
      const cleanupErrors = [];

      if (currentSong.audio_path) {
        const { error } = await supabase.storage
          .from("song-audio")
          .remove([currentSong.audio_path]);

        if (error) {
          cleanupErrors.push(`Audio file: ${error.message}`);
        }
      }

      if (currentSong.cover_image_path) {
        const { error } = await supabase.storage
          .from("song-cover")
          .remove([currentSong.cover_image_path]);

        if (error) {
          cleanupErrors.push(`Cover image: ${error.message}`);
        }
      }

      if (cleanupErrors.length > 0) {
        setActionError(
          `The song record was deleted, but some files may remain in Storage. ${cleanupErrors.join(" | ")}`,
        );
      } else {
        setActionMessage(
          `"${currentSong.title}" and its associated files were deleted successfully.`,
        );
      }
    } catch (error) {
      setActionError(error.message || "Unable to delete this song.");
    } finally {
      setDeletingSongId(null);
    }
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-brand">GOSPELOVA</p>
          <h1>Manage Songs</h1>
          <p>View and manage your music library.</p>
        </div>

        <div className="admin-song-header-actions">
          <Link to="/admin" className="admin-secondary-link">
            Dashboard
          </Link>
          <Link to="/admin/songs/new" className="admin-action-button">
            + Add Song
          </Link>
        </div>
      </header>

      <section className="admin-song-library">
        <div className="admin-song-library-heading">
          <div>
            <h2>Your Song Library</h2>
            {actionMessage && (
              <p className="admin-success" role="status">
                {actionMessage}
              </p>
            )}

            {actionError && (
              <p className="admin-error" role="alert">
                {actionError}
              </p>
            )}
            <p>
              {songs.length} {songs.length === 1 ? "song" : "songs"} in total
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadSongs}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading && <p>Loading songs...</p>}

        {!loading && error && (
          <div className="admin-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadSongs}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && songs.length === 0 && (
          <div className="admin-empty-state">
            <h3>No songs yet</h3>
            <p>Your uploaded songs will appear here.</p>
            <Link to="/admin/songs/new" className="admin-action-button">
              Upload Your First Song
            </Link>
          </div>
        )}

        {!loading && !error && songs.length > 0 && (
          <div className="admin-song-table-wrap">
            <table className="admin-song-table">
              <thead>
                <tr>
                  <th>Song</th>
                  <th>Artist</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date Added</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {songs.map((song) => (
                  <tr key={song.id}>
                    <td>
                      <strong>{song.title}</strong>
                      <small>{song.slug}</small>
                    </td>

                    <td>{song.artists?.name || "Unknown artist"}</td>

                    <td>{song.categories?.name || "Uncategorized"}</td>

                    <td>
                      <span
                        className={
                          song.is_published
                            ? "admin-status admin-status-published"
                            : "admin-status admin-status-draft"
                        }
                      >
                        {song.is_published ? "Published" : "Unpublished"}
                      </span>
                    </td>

                    <td>{new Date(song.created_at).toLocaleDateString()}</td>

                    <td>
                      <div className="admin-song-row-actions">
                        <Link
                          to={`/admin/songs/edit/${song.id}`}
                          className="admin-edit-button"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          className="admin-refresh-button"
                          disabled={updatingSongId === song.id}
                          onClick={() => togglePublish(song)}
                        >
                          {updatingSongId === song.id
                            ? "Updating..."
                            : song.is_published
                              ? "Unpublish"
                              : "Publish"}
                        </button>

                        <button
                          type="button"
                          className="admin-delete-button"
                          disabled={
                            deletingSongId === song.id ||
                            updatingSongId === song.id
                          }
                          onClick={() => deleteSong(song)}
                        >
                          {deletingSongId === song.id
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
      </section>
    </main>
  );
}

export default ManageSongs;
