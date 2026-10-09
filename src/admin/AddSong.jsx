import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AddSong() {
  const navigate = useNavigate();

  const [artists, setArtists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    artist_id: "",
    category_id: "",
    description: "",
    lyrics: "",
    release_date: "",
    is_published: false,
  });

  const [coverFile, setCoverFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      const [artistResult, categoryResult] = await Promise.all([
        supabase.from("artists").select("id,name").order("name"),
        supabase.from("categories").select("id,name").order("name"),
      ]);

      if (!active) return;

      if (artistResult.error || categoryResult.error) {
        setError(
          artistResult.error?.message ||
            categoryResult.error?.message ||
            "Could not load artists and categories.",
        );
      } else {
        setArtists(artistResult.data ?? []);
        setCategories(categoryResult.data ?? []);
      }

      setLoadingOptions(false);
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!coverFile || !audioFile) {
      setError("Please select both a cover image and an audio file.");
      return;
    }

    if (!coverFile.type.startsWith("image/")) {
      setError("The cover file must be an image.");
      return;
    }

    if (
      ![
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/ogg",
        "audio/mp4",
      ].includes(audioFile.type)
    ) {
      setError("Choose a supported audio file, such as an MP3.");
      return;
    }

    if (coverFile.size > 5 * 1024 * 1024) {
      setError("Cover images must be 5 MB or smaller.");
      return;
    }

    if (audioFile.size > 20 * 1024 * 1024) {
      setError("Audio files must be 20 MB or smaller for this MVP form.");
      return;
    }

    const slug = await makeUniqueSlug(form.title);

    async function makeUniqueSlug(title) {
      const baseSlug = makeSlug(title);
      let candidate = baseSlug;
      let counter = 2;

      while (true) {
        const { data, error } = await supabase
          .from("songs")
          .select("id")
          .eq("slug", candidate)
          .maybeSingle();

        if (error) throw error;

        if (!data) return candidate;

        candidate = `${baseSlug}-${counter}`;
        counter += 1;
      }
    }

    if (!slug) {
      setError("Enter a valid song title.");
      return;
    }

    setSaving(true);

    let uploadedCoverPath = null;
    let uploadedAudioPath = null;

    try {
      // Verify the signed-in account is an authorized admin.
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (adminError || !admin) {
        throw new Error("You are not authorized to upload songs.");
      }

      const uniqueId = crypto.randomUUID();
      const coverExtension = coverFile.name.split(".").pop().toLowerCase();
      const audioExtension = audioFile.name.split(".").pop().toLowerCase();

      uploadedCoverPath = `${uniqueId}.${coverExtension}`;
      uploadedAudioPath = `${uniqueId}.${audioExtension}`;

      const { error: coverError } = await supabase.storage
        .from("song-cover")
        .upload(uploadedCoverPath, coverFile, {
          contentType: coverFile.type,
          upsert: false,
        });

      if (coverError) throw coverError;

      const { error: audioError } = await supabase.storage
        .from("song-audio")
        .upload(uploadedAudioPath, audioFile, {
          contentType: audioFile.type,
          upsert: false,
        });

      if (audioError) throw audioError;

      const { error: insertError } = await supabase.from("songs").insert({
        title: form.title.trim(),
        slug,
        artist_id: form.artist_id || null,
        category_id: form.category_id || null,
        description: form.description.trim() || null,
        lyrics: form.lyrics.trim() || null,
        release_date: form.release_date || null,
        cover_image_path: uploadedCoverPath,
        audio_path: uploadedAudioPath,
        is_published: form.is_published,
      });

      if (insertError) throw insertError;

      setSuccess(
        form.is_published
          ? "Song uploaded and published successfully!"
          : "Song saved as a draft successfully!",
      );

      setTimeout(() => navigate("/admin"), 1200);
    } catch (err) {
      // Remove uploaded files if saving the song record fails.
      if (uploadedCoverPath) {
        await supabase.storage.from("song-cover").remove([uploadedCoverPath]);
      }

      if (uploadedAudioPath) {
        await supabase.storage.from("song-audio").remove([uploadedAudioPath]);
      }

      setError(err.message || "Song upload failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-brand">GOSPELOVA</p>
          <h1>Add Song</h1>
          <p>Upload music, artwork, and lyrics.</p>
        </div>

        <Link className="admin-back-link" to="/admin">
          Back to dashboard
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

        <label htmlFor="song-title">Song title *</label>
        <input
          id="song-title"
          name="title"
          value={form.title}
          onChange={updateField}
          required
        />

        <label htmlFor="song-artist">Artist</label>
        <select
          id="song-artist"
          name="artist_id"
          value={form.artist_id}
          onChange={updateField}
          disabled={loadingOptions}
        >
          <option value="">Select artist</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>

        <label htmlFor="song-category">Category</label>
        <select
          id="song-category"
          name="category_id"
          value={form.category_id}
          onChange={updateField}
          disabled={loadingOptions}
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <label htmlFor="song-description">Description</label>
        <textarea
          id="song-description"
          name="description"
          rows="3"
          value={form.description}
          onChange={updateField}
        />

        <label htmlFor="song-lyrics">Lyrics</label>
        <textarea
          id="song-lyrics"
          name="lyrics"
          rows="8"
          value={form.lyrics}
          onChange={updateField}
          placeholder="Enter the song lyrics..."
        />

        <label htmlFor="song-release-date">Release date</label>
        <input
          id="song-release-date"
          type="date"
          name="release_date"
          value={form.release_date}
          onChange={updateField}
        />

        <label htmlFor="song-cover">Cover image * (max 5 MB)</label>
        <input
          id="song-cover"
          type="file"
          accept="image/*"
          onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
          required
        />

        <label htmlFor="song-audio">Audio file * (max 20 MB)</label>
        <input
          id="song-audio"
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4"
          onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
          required
        />

        <label className="admin-publish-option">
          <input
            type="checkbox"
            name="is_published"
            checked={form.is_published}
            onChange={updateField}
          />
          Publish immediately
        </label>

        <button type="submit" disabled={saving || loadingOptions}>
          {saving
            ? "Uploading song..."
            : form.is_published
              ? "Upload & Publish"
              : "Save as Draft"}
        </button>
      </form>
    </main>
  );
}

export default AddSong;
