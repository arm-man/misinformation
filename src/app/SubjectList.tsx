"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LandingSubject } from "@/lib/landing-types";
import styles from "./page.module.css";

export default function SubjectList({ subjects }: { subjects: LandingSubject[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function openSubject(subjectId: number) {
    setPendingId(subjectId);
    setError("");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });
      if (!response.ok) throw new Error("Could not open this examination. Please try again.");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("sessionId" in data) ||
          typeof data.sessionId !== "number" || !Number.isSafeInteger(data.sessionId)) {
        throw new Error("Could not open this examination. Please try again.");
      }
      router.push(`/sessions/${data.sessionId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open this examination. Please try again.");
      setPendingId(null);
    }
  }

  if (subjects.length === 0) return <p className={styles.emptySubjects}>No examinations are available yet. Please check back soon.</p>;

  return <>
    <div className={styles.subjectGrid}>
      {subjects.map((subject) => {
        const label = subject.status === "not-started" ? "Not started" : subject.status === "in-progress" ? "In progress" : "Completed";
        const action = subject.status === "not-started" ? "Start examination" : subject.status === "in-progress" ? "Continue examination" : "View examination";
        const statusClass = subject.status === "in-progress" ? styles.statusProgress : subject.status === "complete" ? styles.statusComplete : "";
        return <button key={subject.id} type="button" className={styles.subjectCard} disabled={pendingId !== null} onClick={() => openSubject(subject.id)}>
          <span className={`${styles.subjectStatus} ${statusClass}`}>{label}</span>
          <span className={styles.subjectTitle}>{subject.title}</span>
          <span className={styles.subjectAction}>{pendingId === subject.id ? "Opening…" : action}</span>
        </button>;
      })}
    </div>
    {error && <p className={styles.actionError} role="alert">{error}</p>}
  </>;
}
