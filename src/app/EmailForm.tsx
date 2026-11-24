"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidEmail, MAX_EMAIL_LENGTH } from "@/lib/email";
import styles from "./page.module.css";

export default function EmailForm({ returnTo = "/" }: { returnTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidEmail(email.trim()) || pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/student/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) throw new Error("Could not save your email. Please try again.");
      router.replace(`${returnTo}?emailSaved=1`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Could not save your email. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <section className={`${styles.emailSection} ${returnTo !== "/" ? styles.emailCompact : ""}`} aria-labelledby="email-title">
    <div>
      <span className={styles.eyebrow}>Stay connected</span>
      <h2 id="email-title">Save your results</h2>
      <p>Enter your email address to save your results and receive a notification when new examinations are available.</p>
    </div>
    <div>
      <form className={styles.emailForm} onSubmit={submit}>
        <input aria-label="Email address" type="email" autoComplete="email" placeholder="Your email address" value={email} maxLength={MAX_EMAIL_LENGTH} onChange={(event) => setEmail(event.target.value)} required />
        <button type="submit" disabled={!isValidEmail(email.trim()) || pending}>{pending ? "Saving…" : "Submit"}</button>
      </form>
      {message && <p className={styles.emailMessage} role="alert">{message}</p>}
    </div>
  </section>;
}
