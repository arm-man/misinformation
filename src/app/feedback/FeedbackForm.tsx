"use client";

import { useState } from "react";
import styles from "@/app/public.module.css";

export default function FeedbackForm({ isGuest }: { isGuest: boolean }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (message.trim().length < 5 || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!response.ok) throw new Error("Feedback could not be saved. Please try again.");
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Feedback could not be saved. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <section className={styles.panel} aria-labelledby="feedback-title">
    <h2 id="feedback-title" className={styles.sectionTitle}>Tell us what you think</h2>
    {submitted ? <p className={styles.success} role="status">Thank you for your feedback.</p> :
      <form onSubmit={submit}>
        <label htmlFor="general-feedback" className={styles.muted}>Your feedback</label>
        <textarea id="general-feedback" className={styles.feedbackArea} value={message} onChange={(event) => setMessage(event.target.value)} />
        <div className={styles.formAction}><button className={styles.button} type="submit" disabled={message.trim().length < 5 || pending} title={isGuest ? "Submit Anonymously" : "Submit"}>
          {pending ? "Submitting…" : isGuest ? "Submit Anonymously" : "Submit"}
        </button></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </form>}
  </section>;
}
