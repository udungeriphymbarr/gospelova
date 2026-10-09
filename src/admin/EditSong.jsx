import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

function EditSong() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    artist_id: "",
    category_id: "",
    description: "",
    lyrics: "",
    release_date: "",
    is_published: false,
  });

  const [artists, setArtists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadForm() {
      try {
        const [
          { data: song, error: songError },
          { data: artistData, error: artistError },
          { data: categoryData, error: categoryError },
        ] = await Promise.all([
          supabase.from("songs").select("*").eq("id", id).maybeSingle(),
          supabase.from("artists").select("id, name").order("name"),
          supabase.from("categories").select("id, name").order("name"),
        ]);

        if (songError) throw songError;
        if (artistError) throw artistError;
        if (categoryError) throw categoryError;
        if (!song) throw new Error("Song not found.");

        if (active) {
          setForm({
            title: song.title ?? "",
            artist_id: song.artist_id ?? "",
            category_id: song.category_id ?? "",
            description: song.description ?? "",
            lyrics: song.lyrics ?? "",
            release_date: song.release_date ?? "",
            is_published: song.is_published ?? false,
          });
          setArtists(artistData ?? []);
          setCategories(categoryData ?? []);
        }
      } catch (err) {
        if (active) setError(err.message || "Unable to load song.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadForm();

    return () => {
      active = false;
    };
  }, [id]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const uploadedPaths = {
      cover: null,
      audio: null,
    };

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Please sign in again.");
      }

      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (adminError || !admin) {
        throw new Error("You are not authorized to edit songs.");
      }

      if (!form.title.trim()) {
        throw new Error("Song title is required.");
      }

      const { data: currentSong, error: currentSongError } = await supabase
        .from("songs")
        .select("slug, audio_path, cover_image_path")
        .eq("id", id)
        .single();

      if (currentSongError) throw currentSongError;

      const updateData = {
        title: form.title.trim(),
        artist_id: form.artist_id || null,
        category_id: form.category_id || null,
        description: form.description.trim() || null,
        lyrics: form.lyrics.trim() || null,
        release_date: form.release_date || null,
        is_published: form.is_published,
      };

      if (coverFile) {
        if (!coverFile.type.startsWith("image/")) {
          throw new Error("Please select a valid image file.");
        }

        if (coverFile.size > 5 * 1024 * 1024) {
          throw new Error("Cover image must be 5 MB or smaller.");
        }

        const extension =
          coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("song-cover")
          .upload(path, coverFile, { upsert: false });

        if (uploadError) throw uploadError;

        uploadedPaths.cover = path;
        updateData.cover_image_path = path;
      }

      if (audioFile) {
        const allowedTypes = [
          "audio/mpeg",
          "audio/mp3",
          "audio/wav",
          "audio/x-wav",
          "audio/ogg",
          "audio/mp4",
          "audio/aac",
        ];

        if (audioFile.type && !allowedTypes.includes(audioFile.type)) {
          throw new Error("Please select a supported audio file.");
        }

        if (audioFile.size > 20 * 1024 * 1024) {
          throw new Error("Audio file must be 20 MB or smaller.");
        }

        const extension =
          audioFile.name.split(".").pop()?.toLowerCase() || "mp3";
        const path = `${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("song-audio")
          .upload(path, audioFile, { upsert: false });

        if (uploadError) throw uploadError;

        uploadedPaths.audio = path;
        updateData.audio_path = path;
      }

      const { error: updateError } = await supabase
        .from("songs")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // Remove replaced files only after the database update succeeds.
      const pathsToRemove = [];

      if (uploadedPaths.cover && currentSong.cover_image_path) {
        pathsToRemove.push({
          bucket: "song-cover",
          path: currentSong.cover_image_path,
        });
      }

      if (uploadedPaths.audio && currentSong.audio_path) {
        pathsToRemove.push({
          bucket: "song-audio",
          path: currentSong.audio_path,
        });
      }

      for (const file of pathsToRemove) {
        const { error: removeError } = await supabase.storage
          .from(file.bucket)
          .remove([file.path]);

        if (removeError) {
          console.error("Old file cleanup failed:", removeError);
        }
      }

      setSuccess("Song updated successfully.");
      setTimeout(() => navigate("/admin/songs"), 1000);
    } catch (err) {
      // Clean up newly uploaded files if saving fails.
      if (uploadedPaths.cover) {
        await supabase.storage.from("song-cover").remove([uploadedPaths.cover]);
      }

      if (uploadedPaths.audio) {
        await supabase.storage.from("song-audio").remove([uploadedPaths.audio]);
      }

      setError(err.message || "Unable to update song.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-login-page">
        <p>Loading song...</p>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-brand">GOSPELOVA</p>
          <h1>Edit Song</h1>
          <p>Update song details, lyrics, and media.</p>
        </div>

        <Link to="/admin/songs" className="admin-secondary-link">
          Back to Songs
        </Link>
      </header>

      <form className="admin-song-form" onSubmit={handleSubmit}>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="admin-success" role="status">
            {success}
          </p>
        )}

        <label htmlFor="edit-title">Song title *</label>
        <input
          id="edit-title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <label htmlFor="edit-artist">Artist</label>
        <select
          id="edit-artist"
          name="artist_id"
          value={form.artist_id}
          onChange={handleChange}
        >
          <option value="">Select artist</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>

        <label htmlFor="edit-category">Category</label>
        <select
          id="edit-category"
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <label htmlFor="edit-description">Description</label>
        <textarea
          id="edit-description"
          name="description"
          rows="4"
          value={form.description}
          onChange={handleChange}
        />

        <label htmlFor="edit-lyrics">Lyrics</label>
        <textarea
          id="edit-lyrics"
          name="lyrics"
          rows="10"
          value={form.lyrics}
          onChange={handleChange}
        />

        <label htmlFor="edit-release-date">Release date</label>
        <input
          id="edit-release-date"
          name="release_date"
          type="date"
          value={form.release_date}
          onChange={handleChange}
        />

        <label htmlFor="edit-cover">Replace cover image (optional)</label>
        <input
          id="edit-cover"
          type="file"
          accept="image/*"
          onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
        />

        <label htmlFor="edit-audio">Replace audio file (optional)</label>
        <input
          id="edit-audio"
          type="file"
          accept="audio/*"
          onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
        />

        <label className="admin-publish-checkbox">
          <input
            type="checkbox"
            name="is_published"
            checked={form.is_published}
            onChange={handleChange}
          />
          Publish this song
        </label>

        <button type="submit" disabled={saving}>
          {saving ? "Saving changes..." : "Save Changes"}
        </button>
      </form>
    </main>
  );
}

export default EditSong;
