import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

function AddArtist() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
        .from("artists")
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
      setError("Please enter the artist's name.");
      return;
    }

    if (image && !image.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (image && image.size > 5 * 1024 * 1024) {
      setError("The image must be 5MB or smaller.");
      return;
    }

    setLoading(true);
    let uploadedImagePath = null;

    try {
      // Verify the signed-in user.
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Please log in to your admin account.");
      }

      // Verify admin membership.
      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (adminError || !admin) {
        throw new Error("You do not have permission to add artists.");
      }

      const baseSlug = createSlug(trimmedName);

      if (!baseSlug) {
        throw new Error("Please enter a valid artist name.");
      }

      const slug = await makeUniqueSlug(baseSlug);

      // Upload the artist photo if one was selected.
      if (image) {
        const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
        uploadedImagePath = `artists/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("song-cover")
          .upload(uploadedImagePath, image, {
            contentType: image.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;
      }

      // Save the artist record.
      const { error: insertError } = await supabase.from("artists").insert({
        name: trimmedName,
        slug,
        bio: bio.trim() || null,
        image_path: uploadedImagePath,
      });

      if (insertError) throw insertError;

      setMessage("Artist added successfully!");
      setName("");
      setBio("");
      setImage(null);

      const fileInput = document.getElementById("artist-image");
      if (fileInput) fileInput.value = "";

      setTimeout(() => navigate("/admin/artists"), 1000);
    } catch (err) {
      // Clean up the uploaded image if the database insert failed.
      if (uploadedImagePath) {
        const { error: cleanupError } = await supabase.storage
          .from("song-cover")
          .remove([uploadedImagePath]);

        if (cleanupError) {
          console.error("Artist image cleanup failed:", cleanupError);
        }
      }

      setError(err.message || "Unable to add artist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-song-library-heading">
        <div>
          <h1>Add Artist</h1>
          <p>Add a gospel artist to the Gospelova music library.</p>
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
          <label htmlFor="artist-name">Artist Name *</label>
          <input
            id="artist-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Nathaniel Bassey"
            maxLength={120}
            required
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="artist-bio">Biography</label>
          <textarea
            id="artist-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Write a short biography about the artist..."
            rows={6}
            maxLength={5000}
          />
        </div>

        <div className="admin-form-group">
          <label htmlFor="artist-image">Artist Photo (optional)</label>
          <input
            id="artist-image"
            type="file"
            accept="image/*"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          />
          <small>Maximum file size: 5MB.</small>
        </div>

        <button
          type="submit"
          className="admin-action-button"
          disabled={loading}
        >
          {loading ? "Adding Artist..." : "Add Artist"}
        </button>
      </form>
    </main>
  );
}

export default AddArtist;
