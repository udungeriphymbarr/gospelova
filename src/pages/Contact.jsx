import { useState } from "react";
import { supabase } from "../lib/supabase";
import "../styles/contact.css";

const WHATSAPP_NUMBER = "2347083038043";

const INITIAL_FORM = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    text: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFeedback({ type: "", text: "" });

    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!name || !email || !subject || !message) {
      setFeedback({
        type: "error",
        text: "Please complete all fields.",
      });
      return;
    }

    if (
      name.length > 100 ||
      email.length > 254 ||
      subject.length > 200 ||
      message.length > 10000
    ) {
      setFeedback({
        type: "error",
        text: "One or more fields exceed the allowed length.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          name,
          email,
          subject,
          message,
        },
      ]);

      if (error) throw error;

      setForm(INITIAL_FORM);
      setFeedback({
        type: "success",
        text: "Your message has been received. Thank you for contacting Gospelova!",
      });
    } catch (error) {
      console.error("Contact form submission failed:", error);

      setFeedback({
        type: "error",
        text: "We couldn't send your message right now. Please try again or contact us on WhatsApp.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const whatsappMessage = encodeURIComponent(
    "Hello Gospelova! I would like to get in touch.",
  );

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <p className="contact-eyebrow">WE'D LOVE TO HEAR FROM YOU</p>
        <h1>Contact Gospelova</h1>
        <p>
          Have a question, a music submission, a story idea, or feedback? Send
          us a message. Let's connect through the power of gospel music.
        </p>
      </section>

      <section className="contact-content">
        <div className="contact-info">
          <h2>Let's Connect</h2>
          <p>
            Whether you're an artist, listener, ministry, or music enthusiast,
            we're happy to hear from you.
          </p>

          <a
            className="contact-whatsapp-button"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true">↗</span>
            Chat with us on WhatsApp
          </a>

          <p className="contact-note">
            You can also use the form to send us a message directly.
          </p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>Send Us a Message</h2>

          {feedback.text && (
            <p
              className={`contact-feedback contact-feedback--${feedback.type}`}
              role={feedback.type === "error" ? "alert" : "status"}
            >
              {feedback.text}
            </p>
          )}

          <div className="contact-field">
            <label htmlFor="contact-name">Full Name *</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-email">Email Address *</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              maxLength={254}
              required
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-subject">Subject *</label>
            <input
              id="contact-subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              maxLength={200}
              placeholder="What would you like to discuss?"
              required
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-message">Your Message *</label>
            <textarea
              id="contact-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              maxLength={10000}
              rows={7}
              placeholder="Write your message here..."
              required
            />
          </div>

          <button
            className="contact-submit-button"
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Sending your message..." : "Send Message"}
          </button>

          <p className="contact-privacy-note">
            Your message is stored securely and is accessible to authorized
            Gospelova administrators.
          </p>
        </form>
      </section>
    </main>
  );
}

export default Contact;
