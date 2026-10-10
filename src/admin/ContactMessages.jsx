import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

const WHATSAPP_NUMBER = "2347083038043";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("contact_messages")
      .select("id, name, email, subject, message, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Loading contact messages failed:", error);
      setErrorMessage(
        "Unable to load messages. Check that you are signed in as an authorized admin.",
      );
    } else {
      setMessages(data ?? []);
    }

    setLoading(false);
  }

  async function updateStatus(message, status) {
    setUpdatingId(message.id);
    setErrorMessage("");
    setNotice("");

    const { error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", message.id);

    if (error) {
      console.error("Updating message status failed:", error);
      setErrorMessage("Could not update the message status.");
      setUpdatingId(null);
      return;
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === message.id ? { ...item, status } : item,
      ),
    );

    setNotice(`Message marked as ${status}.`);
    setUpdatingId(null);
  }

  async function openMessage(message) {
    setSelectedId(message.id);

    if (message.status === "new") {
      await updateStatus(message, "read");
    }
  }

  async function deleteMessage(message) {
    const confirmed = window.confirm(
      `Delete the message from ${message.name}? This cannot be undone.`,
    );

    if (!confirmed) return;

    setErrorMessage("");
    setNotice("");

    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", message.id);

    if (error) {
      console.error("Deleting contact message failed:", error);
      setErrorMessage("Could not delete the message.");
      return;
    }

    setMessages((current) => current.filter((item) => item.id !== message.id));

    if (selectedId === message.id) {
      setSelectedId(null);
    }

    setNotice("Message deleted.");
  }

  function formatDate(value) {
    if (!value) return "Date unavailable";

    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleMessages = messages.filter((message) => {
    const matchesStatus = filter === "all" || message.status === filter;

    const searchableText = [
      message.name,
      message.email,
      message.subject,
      message.message,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(normalizedQuery);

    return matchesStatus && matchesSearch;
  });

  const selectedMessage =
    messages.find((message) => message.id === selectedId) ?? null;

  const newCount = messages.filter(
    (message) => message.status === "new",
  ).length;

  const whatsappText = selectedMessage
    ? `Hello Gospelova team. I'm following up on the contact message regarding: ${selectedMessage.subject}.`
    : "Hello Gospelova!";

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-brand">GOSPELOVA</p>
          <h1>Contact Messages</h1>
          <p>
            {messages.length} total messages · {newCount} new
          </p>
        </div>

        <Link to="/admin" className="admin-action-button">
          Back to Dashboard
        </Link>
      </header>

      <section className="admin-welcome-card">
        <div className="admin-inbox-toolbar">
          <h2>Inbox</h2>

          <button type="button" onClick={loadMessages} disabled={loading}>
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

        <div className="admin-inbox-controls">
          <div className="admin-inbox-search">
            <label htmlFor="message-search">Search messages</label>
            <input
              id="message-search"
              type="search"
              placeholder="Search name, email, subject or message..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="admin-inbox-filters">
            <label htmlFor="message-filter">Filter by status</label>
            <select
              id="message-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All messages ({messages.length})</option>
              {STATUS_OPTIONS.map((option) => {
                const count = messages.filter(
                  (message) => message.status === option.value,
                ).length;

                return (
                  <option key={option.value} value={option.value}>
                    {option.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading messages...</p>
        ) : visibleMessages.length === 0 ? (
          <div className="admin-inbox-empty">
            <h3>
              {searchQuery.trim() || filter !== "all"
                ? "No matching messages"
                : "Your inbox is empty"}
            </h3>
            <p>
              {searchQuery.trim() || filter !== "all"
                ? "Try another search term or change the status filter."
                : "Contact form submissions will appear here."}
            </p>
            {(searchQuery.trim() || filter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilter("all");
                }}
              >
                Clear search and filters
              </button>
            )}
          </div>
        ) : (
          <div className="admin-inbox-list">
            {visibleMessages.map((message) => (
              <article
                key={message.id}
                className={`admin-inbox-item ${
                  message.status === "new" ? "is-new" : ""
                }`}
              >
                <button
                  type="button"
                  className="admin-inbox-open"
                  onClick={() => openMessage(message)}
                >
                  <span className="admin-inbox-heading">
                    <strong>{message.subject}</strong>
                    <span
                      className={`admin-message-status status-${message.status}`}
                    >
                      {STATUS_OPTIONS.find(
                        (option) => option.value === message.status,
                      )?.label ?? message.status}
                    </span>
                  </span>

                  <span className="admin-inbox-sender">
                    From: {message.name} · {message.email}
                  </span>

                  <span className="admin-inbox-date">
                    {formatDate(message.created_at)}
                  </span>

                  <span className="admin-inbox-preview">{message.message}</span>

                  <span className="admin-inbox-hint">
                    Select to read full message
                  </span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedMessage && (
        <section className="admin-welcome-card admin-message-detail">
          <h2>{selectedMessage.subject}</h2>

          <p>
            <strong>From:</strong> {selectedMessage.name}
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a href={`mailto:${selectedMessage.email}`}>
              {selectedMessage.email}
            </a>
          </p>
          <p>
            <strong>Received:</strong> {formatDate(selectedMessage.created_at)}
          </p>
          <p>
            <strong>Status:</strong> {selectedMessage.status}
          </p>

          <div className="admin-message-body">{selectedMessage.message}</div>

          <div className="admin-message-actions">
            <a
              className="admin-action-button"
              href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                `Re: ${selectedMessage.subject}`,
              )}`}
            >
              Reply by Email
            </a>

            <a
              className="admin-action-button"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Gospelova WhatsApp
            </a>

            {STATUS_OPTIONS.filter(
              (option) => option.value !== selectedMessage.status,
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={updatingId === selectedMessage.id}
                onClick={() => updateStatus(selectedMessage, option.value)}
              >
                Mark {option.label}
              </button>
            ))}

            <button
              type="button"
              className="admin-delete-button"
              onClick={() => deleteMessage(selectedMessage)}
            >
              Delete Message
            </button>

            <button type="button" onClick={() => setSelectedId(null)}>
              Close
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default ContactMessages;
