import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import DOMPurify from "dompurify";
import RichTextEditor from "../components/RichTextEditor";
import "../styles/admin.css";

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Gospel News",
  author: "Gospelova Editorial Team",
  source_name: "",
  source_url: "",
  cover_image_path: "",
  is_published: false,
};

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function BlogManagement() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load blog posts:", error);
      setErrorMessage(
        "Could not load blog posts. Check your admin permissions and try again.",
      );
    } else {
      setPosts(data ?? []);
    }

    setLoading(false);
  }

  function handleTitleChange(value) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugManuallyEdited ? current.slug : makeSlug(value),
    }));
  }

  function handleFieldChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("The cover image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setSlugManuallyEdited(false);
    setMessage("");
    setErrorMessage("");
    setPreviewMode(false);

    const fileInput = document.getElementById("blog-cover-image");
    if (fileInput) fileInput.value = "";
  }

  function editPost(post) {
    setEditingId(post.id);
    setForm({
      title: post.title ?? "",
      slug: post.slug ?? "",
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      category: post.category ?? "Gospel News",
      author: post.author ?? "Gospelova Editorial Team",
      source_name: post.source_name ?? "",
      source_url: post.source_url ?? "",
      cover_image_path: post.cover_image_path ?? "",
      is_published: post.is_published ?? false,
    });

    setImageFile(null);
    setImagePreview("");
    setSlugManuallyEdited(true);
    setMessage("");
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPreviewMode(false);
  }

  async function uploadCoverImage() {
    if (!imageFile) return form.cover_image_path;

    const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const imagePath = `blog/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("song-cover")
      .upload(imagePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (error) throw error;

    return imagePath;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const title = form.title.trim();
      const slug = makeSlug(form.slug);

      if (!title) throw new Error("Please enter an article title.");
      if (!slug) throw new Error("Please enter a valid article slug.");
      const contentText = form.content
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .trim();

      if (!contentText) {
        throw new Error("Please write the article content.");
      }

      if (form.source_url.trim()) {
        let sourceUrl;

        try {
          sourceUrl = new URL(form.source_url.trim());
        } catch {
          throw new Error("Please enter a valid source URL.");
        }

        if (!["http:", "https:"].includes(sourceUrl.protocol)) {
          throw new Error("Source URLs must begin with http:// or https://.");
        }
      }

      const coverImagePath = await uploadCoverImage();

      const postData = {
        title,
        slug,
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        category: form.category.trim() || "Gospel News",
        author: form.author.trim() || "Gospelova Editorial Team",
        source_name: form.source_name.trim() || null,
        source_url: form.source_url.trim() || null,
        cover_image_path: coverImagePath || null,
        is_published: form.is_published,
        published_at: form.is_published
          ? posts.find((post) => post.id === editingId)?.published_at ||
            new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (editingId) {
        result = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", editingId);
      } else {
        result = await supabase.from("blog_posts").insert(postData);
      }

      if (result.error) throw result.error;

      setMessage(
        form.is_published
          ? "Article published successfully!"
          : "Draft saved successfully!",
      );

      resetForm();
      await loadPosts();
    } catch (error) {
      console.error("Saving blog post failed:", error);
      setErrorMessage(
        error.message || "Could not save the article. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(post) {
    setMessage("");
    setErrorMessage("");

    const nextPublished = !post.is_published;

    const { error } = await supabase
      .from("blog_posts")
      .update({
        is_published: nextPublished,
        published_at: nextPublished
          ? post.published_at || new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    if (error) {
      console.error("Updating publication status failed:", error);
      setErrorMessage(error.message || "Could not update publication status.");
      return;
    }

    setMessage(
      nextPublished ? "Article published." : "Article moved to drafts.",
    );
    await loadPosts();
  }

  async function deletePost(post) {
    const confirmed = window.confirm(
      `Delete "${post.title}" permanently? This cannot be undone.`,
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      console.error("Deleting blog post failed:", error);
      setErrorMessage(error.message || "Could not delete the article.");
      return;
    }

    if (editingId === post.id) resetForm();

    setMessage("Article deleted.");
    await loadPosts();
  }

  function getCoverUrl(path) {
    if (!path) return "";

    return supabase.storage.from("song-cover").getPublicUrl(path).data
      .publicUrl;
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-brand">GOSPELOVA</p>
          <h1>Blog Management</h1>
          <p>Write, edit, and publish Gospelova articles.</p>
        </div>

        <Link to="/admin" className="admin-action-button">
          Back to Dashboard
        </Link>
      </header>

      <section className="admin-welcome-card">
        <h2>{editingId ? "Edit Article" : "Write a New Article"}</h2>
        <p>Save your work as a draft or publish it when it is ready.</p>

        {message && <p className="admin-success">{message}</p>}
        {errorMessage && (
          <p className="admin-error" role="alert">
            {errorMessage}
          </p>
        )}

        <form className="admin-artist-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="blog-title">Article Title *</label>
            <input
              id="blog-title"
              name="title"
              value={form.title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Enter your article title"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="blog-slug">Article URL Slug *</label>
            <input
              id="blog-slug"
              name="slug"
              value={form.slug}
              onChange={(event) => {
                setSlugManuallyEdited(true);
                setForm((current) => ({
                  ...current,
                  slug: makeSlug(event.target.value),
                }));
              }}
              placeholder="my-gospel-article"
              required
            />
            <small>Public link: /blog/{form.slug || "your-article-slug"}</small>
          </div>

          <div className="admin-form-group">
            <label htmlFor="blog-excerpt">Short Description</label>
            <textarea
              id="blog-excerpt"
              name="excerpt"
              value={form.excerpt}
              onChange={handleFieldChange}
              rows={3}
              placeholder="A short summary for the blog listing"
            />
          </div>

          <div className="admin-form-group">
            <label>Full Article *</label>

            <div className="blog-editor-actions">
              <button
                type="button"
                className="admin-edit-button"
                onClick={() => setPreviewMode(false)}
                disabled={!previewMode}
              >
                Edit Article
              </button>

              <button
                type="button"
                className="admin-edit-button"
                onClick={() => setPreviewMode(true)}
                disabled={previewMode}
              >
                Preview Article
              </button>
            </div>

            {previewMode ? (
              <div className="blog-editor-preview">
                <h2>{form.title || "Article preview"}</h2>
                <div
                  className="gospel-article-content"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(form.content),
                  }}
                />
              </div>
            ) : (
              <RichTextEditor
                value={form.content}
                onChange={(content) =>
                  setForm((current) => ({ ...current, content }))
                }
                disabled={saving}
              />
            )}

            <small>
              Format your article with headings, bold, italic, lists,
              quotations, and links. Use Preview Article to review your work.
            </small>
          </div>

          <div className="admin-form-group">
            <label htmlFor="blog-category">Category</label>
            <select
              id="blog-category"
              name="category"
              value={form.category}
              onChange={handleFieldChange}
            >
              <option>Gospel News</option>
              <option>Gospel Music</option>
              <option>Artist Spotlight</option>
              <option>Gospelova Updates</option>
              <option>Devotionals</option>
              <option>Events</option>
              <option>Interviews</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label htmlFor="blog-author">Author</label>
            <input
              id="blog-author"
              name="author"
              value={form.author}
              onChange={handleFieldChange}
              placeholder="Gospelova Editorial Team"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="blog-source-name">
              Source or Publication Name (optional)
            </label>
            <input
              id="blog-source-name"
              name="source_name"
              value={form.source_name}
              onChange={handleFieldChange}
              placeholder="Name of the original news source"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="blog-source-url">
              Source Article URL (optional)
            </label>
            <input
              id="blog-source-url"
              name="source_url"
              type="url"
              value={form.source_url}
              onChange={handleFieldChange}
              placeholder="https://example.com/article"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="blog-cover-image">Cover Image (maximum 5 MB)</label>
            <input
              id="blog-cover-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {imagePreview && (
              <img
                src={imagePreview}
                alt="Selected cover preview"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "320px",
                  marginTop: "12px",
                  borderRadius: "10px",
                }}
              />
            )}

            {!imagePreview && form.cover_image_path && (
              <div>
                <img
                  src={getCoverUrl(form.cover_image_path)}
                  alt="Current article cover"
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "320px",
                    marginTop: "12px",
                    borderRadius: "10px",
                  }}
                />
                <small>Choose a new image above to replace this cover.</small>
              </div>
            )}
          </div>

          <div className="admin-form-group">
            <label>
              <input
                type="checkbox"
                name="is_published"
                checked={form.is_published}
                onChange={handleFieldChange}
              />{" "}
              Publish this article immediately
            </label>
          </div>

          <div className="admin-dashboard-actions">
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Article"
                  : form.is_published
                    ? "Publish Article"
                    : "Save Draft"}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm} disabled={saving}>
                Cancel Editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-welcome-card">
        <h2>Existing Articles</h2>

        {loading ? (
          <p>Loading articles...</p>
        ) : posts.length === 0 ? (
          <p>No articles found yet. Write your first one above.</p>
        ) : (
          <div className="admin-blog-list">
            {posts.map((post) => (
              <article className="admin-blog-item" key={post.id}>
                {post.cover_image_path && (
                  <img
                    className="admin-blog-thumbnail"
                    src={getCoverUrl(post.cover_image_path)}
                    alt=""
                  />
                )}

                <div className="admin-blog-item-info">
                  <h3>{post.title}</h3>
                  <p>
                    {post.category} ·{" "}
                    {post.is_published ? "Published" : "Draft"}
                  </p>
                  <small>
                    {post.created_at
                      ? new Date(post.created_at).toLocaleDateString()
                      : ""}
                  </small>
                </div>

                <div className="admin-blog-item-actions">
                  <button
                    type="button"
                    onClick={() => editPost(post)}
                    className="admin-edit-button"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePublished(post)}
                    className="admin-edit-button"
                  >
                    {post.is_published ? "Unpublish" : "Publish"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deletePost(post)}
                    className="admin-delete-button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default BlogManagement;
