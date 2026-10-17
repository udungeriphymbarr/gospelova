import { useEffect, useState } from "react";
import "../styles/Comments.css";

export default function Comments({ targetType, targetId }) {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ targetType, targetId });
        const response = await fetch(`/api/comments?${params}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load comments.");
        }

        if (!cancelled) setComments(result.comments || []);
      } catch {
        if (!cancelled) setError("Comments couldn't be loaded right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (targetType && targetId) loadComments();
    else setLoading(false);

    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!name.trim() || !content.trim()) {
      setError("Please enter your name and comment.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          name: name.trim(),
          content: content.trim(),
          website: "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not submit your comment.");
      }

      setName("");
      setContent("");
      setMessage(
        "Thanks! Your comment has been submitted for review and will appear after approval.",
      );
    } catch (err) {
      setError(
        err.message || "Could not submit your comment. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="comments-section" aria-labelledby="comments-heading">
      <h2 id="comments-heading">Comments</h2>
      <p className="comments-intro">
        Share your thoughts respectfully. Comments are reviewed before
        publication.
      </p>

      <form className="comments-form" onSubmit={handleSubmit}>
        <label htmlFor="comment-name">Your name</label>
        <input
          id="comment-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          autoComplete="name"
          required
        />

        <label htmlFor="comment-content">Your comment</label>
        <textarea
          id="comment-content"
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={2000}
          rows={5}
          required
        />

        <div className="comments-honeypot" aria-hidden="true">
          <label htmlFor="comment-website">Leave this field empty</label>
          <input
            id="comment-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value=""
            readOnly
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit comment"}
        </button>
      </form>

      {message && (
        <p className="comments-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="comments-error" role="alert">
          {error}
        </p>
      )}

      <div className="comments-list">
        <h3>Community comments</h3>

        {loading ? (
          <p>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p>No approved comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => (
            <article className="comment-item" key={comment.id}>
              <div className="comment-meta">
                <strong>{comment.name}</strong>
                <time dateTime={comment.created_at}>
                  {new Date(comment.created_at).toLocaleDateString()}
                </time>
              </div>
              <p>{comment.content}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
