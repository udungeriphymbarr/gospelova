import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

function EditArtist() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [currentImagePath, setCurrentImagePath] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadArtist() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("artists")
        .select("id, name, bio, image_path")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;

      if (queryError || !data) {
        setError(queryError?.message || "Artist not found.");
      } else {
        setName(data.name || "");
        setBio(data.bio || "");
        setCurrentImagePath(data.image_path || "");
      }

      setLoading(false);
    }

    loadArtist();

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
      setError("Please enter the artist's name.");
      return;
    }

    if (newImage && !newImage.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (newImage && newImage.size > 5 * 1024 * 1024) {
      setError("The image must be 5MB or smaller.");
      return;
    }

    setSaving(true);
    let uploadedImagePath = null;

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
        throw new Error("You do not have permission to edit artists.");
      }

      if (newImage) {
        const extension =
          newImage.name.split(".").pop()?.toLowerCase() || "jpg";

        uploadedImagePath = `artists/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("song-cover")
          .upload(uploadedImagePath, newImage, {
            contentType: newImage.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;
      }

      const updates = {
        name: trimmedName,
        bio: bio.trim() || null,
      };

      if (uploadedImagePath) {
        updates.image_path = uploadedImagePath;
      }

      const { error: updateError } = await supabase
        .from("artists")
        .update(updates)
        .eq("id", id);

      if (updateError) throw updateError;

      if (uploadedImagePath && currentImagePath) {
        const { error: cleanupError } = await supabase.storage
          .from("song-cover")
          .remove([currentImagePath]);

        if (cleanupError) {
          console.error("Old artist image cleanup failed:", cleanupError);
          setMessage(
            "Artist updated, but the previous photo could not be removed.",
          );
        }
      }

      setMessage("Artist updated successfully!");
      setCurrentImagePath(uploadedImagePath || currentImagePath);
      setNewImage(null);

      const fileInput = document.getElementById("edit-artist-image");
      if (fileInput) fileInput.value = "";

      setTimeout(() => navigate("/admin/artists"), 1200);
    } catch (err) {
      if (uploadedImagePath) {
        const { error: cleanupError } = await supabase.storage
          .from("song-cover")
          .remove([uploadedImagePath]);

        if (cleanupError) {
          console.error("New artist image cleanup failed:", cleanupError);
        }
      }

      setError(err.message || "Unable to update artist.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <p>Loading artist details...</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-song-library-heading">
        <div>
          <h1>Edit Artist</h1>
          <p>Update the artist's information and photo.</p>
        </div>

        <Link to="/admin/artists" className="admin-secondary-link">
          Back to Artists
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
          <label htmlFor="edit-artist-name">Artist Name *</label>
          <input
            id="edit-artist-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="edit-artist-bio">Biography</label>
          <textarea
            id="edit-artist-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={6}
            maxLength={5000}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="edit-artist-image">
            Replace Artist Photo (optional)
          </label>
          <input
            id="edit-artist-image"
            type="file"
            accept="image/*"
            onChange={(event) => setNewImage(event.target.files?.[0] ?? null)}
          />
          <small>
            Leave empty to keep the current photo. Maximum size: 5MB.
          </small>
        </div>

        <button type="submit" className="admin-action-button" disabled={saving}>
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </main>
  );
}

export default EditArtist;
