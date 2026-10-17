import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function ManageComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("pending");
  const [updatingId, setUpdatingId] = useState(null);

  async function loadComments() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        name,
        content,
        status,
        created_at,
        song_id,
        blog_post_id,
        songs ( title, slug ),
        blog_posts ( title, slug )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Loading comments failed:", error);
      setErrorMessage(
        "Unable to load comments. Check your admin permissions and database policies.",
      );
    } else {
      setComments(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadComments();
  }, []);

  async function updateStatus(comment, status) {
    setUpdatingId(comment.id);
    setErrorMessage("");
    setNotice("");

    const { data, error } = await supabase
      .from("comments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", comment.id)
      .select("id, status")
      .maybeSingle();

    if (error || !data) {
      console.error("Updating comment status failed:", error);
      setErrorMessage(
        "Could not update the comment. Confirm your admin permissions.",
      );
      setUpdatingId(null);
      return;
    }

    setComments((current) =>
      current.map((item) =>
        item.id === comment.id ? { ...item, status: data.status } : item,
      ),
    );

    setNotice(`Comment marked as ${status}.`);
    setUpdatingId(null);
  }

  async function deleteComment(comment) {
    const confirmed = window.confirm(
      `Permanently delete the comment from ${comment.name}?`,
    );

    if (!confirmed) return;

    setUpdatingId(comment.id);
    setErrorMessage("");
    setNotice("");

    const { data, error } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("Deleting comment failed:", error);
      setErrorMessage(
        "Could not delete the comment. Confirm your admin permissions.",
      );
      setUpdatingId(null);
      return;
    }

    setComments((current) => current.filter((item) => item.id !== comment.id));

    setNotice("Comment permanently deleted.");
    setUpdatingId(null);
  }

  function formatDate(value) {
    if (!value) return "Date unavailable";

    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const visibleComments = comments.filter(
    (comment) => filter === "all" || comment.status === filter,
  );

  const pendingCount = comments.filter(
    (comment) => comment.status === "pending",
  ).length;

  function getTarget(comment) {
    if (comment.songs) {
      return {
        type: "Song",
        title: comment.songs.title,
        url: comment.songs.slug ? `/music/${comment.songs.slug}` : null,
      };
    }

    if (comment.blog_posts) {
      return {
        type: "Blog post",
        title: comment.blog_posts.title,
        url: comment.blog_posts.slug
          ? `/blog/${comment.blog_posts.slug}`
          : null,
      };
    }

    return {
      type: comment.song_id ? "Song" : "Blog post",
      title: "Content title unavailable",
      url: null,
    };
  }

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-brand">GOSPELOVA</p>
          <h1>Manage Comments</h1>
          <p>
            {comments.length} total comments · {pendingCount} pending review
          </p>
        </div>

        <Link to="/admin" className="admin-action-button">
          Back to Dashboard
        </Link>
      </header>

      <section className="admin-welcome-card">
        <div className="admin-inbox-toolbar">
          <h2>Comment Moderation</h2>

          <button type="button" onClick={loadComments} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {notice && (
          <p className="admin-success" role="status">
            {notice}
          </p>
        )}

        {errorMessage && (
          <p className="admin-error" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="admin-inbox-filters">
          <label htmlFor="comment-filter">Filter by status</label>
          <select
            id="comment-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All comments ({comments.length})</option>
            {STATUS_OPTIONS.map((option) => {
              const count = comments.filter(
                (comment) => comment.status === option.value,
              ).length;

              return (
                <option key={option.value} value={option.value}>
                  {option.label} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {loading ? (
          <p>Loading comments...</p>
        ) : visibleComments.length === 0 ? (
          <div className="admin-inbox-empty">
            <h3>No comments to display</h3>
            <p>
              {filter === "pending"
                ? "New visitor comments awaiting approval will appear here."
                : "Try selecting another status filter."}
            </p>
          </div>
        ) : (
          <div className="admin-inbox-list">
            {visibleComments.map((comment) => {
              const target = getTarget(comment);

              return (
                <article className="admin-inbox-item" key={comment.id}>
                  <div className="admin-inbox-open">
                    <span className="admin-inbox-heading">
                      <strong>{comment.name}</strong>
                      <span
                        className={`admin-message-status status-${comment.status}`}
                      >
                        {STATUS_OPTIONS.find(
                          (option) => option.value === comment.status,
                        )?.label ?? comment.status}
                      </span>
                    </span>

                    <span className="admin-inbox-sender">
                      On {target.type}: {target.title}
                      {target.url && (
                        <>
                          {" · "}
                          <Link to={target.url}>View page</Link>
                        </>
                      )}
                    </span>

                    <span className="admin-inbox-date">
                      {formatDate(comment.created_at)}
                    </span>

                    <p className="admin-inbox-preview">{comment.content}</p>

                    <div className="admin-message-actions">
                      {comment.status !== "approved" && (
                        <button
                          type="button"
                          disabled={updatingId === comment.id}
                          onClick={() => updateStatus(comment, "approved")}
                        >
                          Approve
                        </button>
                      )}

                      {comment.status !== "rejected" && (
                        <button
                          type="button"
                          disabled={updatingId === comment.id}
                          onClick={() => updateStatus(comment, "rejected")}
                        >
                          Reject
                        </button>
                      )}

                      <button
                        type="button"
                        className="admin-delete-button"
                        disabled={updatingId === comment.id}
                        onClick={() => deleteComment(comment)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default ManageComments;
