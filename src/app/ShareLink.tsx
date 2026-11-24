"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

export default function ShareLink({ afterEmail }: { afterEmail: boolean }) {
  const [message, setMessage] = useState("");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL("/", window.location.origin).href);
      setMessage("Link copied!");
    } catch {
      setMessage("Could not copy the link. Please try again.");
    }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setMessage(""), 3000);
  }

  return <section className={`${styles.shareSection} ${afterEmail ? styles.shareAfterEmail : ""}`} aria-labelledby="share-title">
    <div>
      <span className={styles.eyebrow}>Pass it along</span>
      <h2 id="share-title">Enjoying this website? Share it with others.</h2>
    </div>
    <div className={styles.shareActions}>
      <span className={styles.shareStatus} role="status" aria-live="polite">{message}</span>
      <button className={styles.shareButton} type="button" onClick={copyLink}>Share</button>
    </div>
  </section>;
}
