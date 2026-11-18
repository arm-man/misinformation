"use client";

import { useState, type FormEvent } from "react";
import styles from "./admin.module.css";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error?.message ?? "Sign in failed. Please try again.");
        return;
      }
      window.location.replace("/admin");
    } catch {
      setError("Could not sign in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.shell}>
      <form className={`${styles.panel} ${styles.login}`} onSubmit={signIn}>
        <p className={styles.eyebrow}>Misinformation Examination</p>
        <h1>Administration</h1>
        <p className={styles.muted}>Sign in to manage Questions.</p>
        <label htmlFor="admin-password">Password</label>
        <input id="admin-password" type="password" autoComplete="current-password"
          value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" disabled={pending || password === ""}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
