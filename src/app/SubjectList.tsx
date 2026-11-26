"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LandingSubject } from "@/lib/landing-types";
import styles from "./page.module.css";

const statusOrder: Record<LandingSubject["status"], number> = {
  "in-progress": 0,
  "not-started": 1,
  complete: 2,
};

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

  const sortedSubjects = [...subjects].sort((a, b) =>
    statusOrder[a.status] - statusOrder[b.status] ||
    a.title.localeCompare(b.title, "en", { sensitivity: "base" }) ||
    a.id - b.id,
  );

  return <>
    <div className={styles.subjectGrid}>
      {sortedSubjects.map((subject) => {
        const label = subject.status === "not-started" ? null : subject.status === "in-progress" ? "In progress" : "Completed";
        const action = pendingId === subject.id ? "Opening…" : null;
        const statusClass = subject.status === "in-progress" ? styles.statusProgress : subject.status === "complete" ? styles.statusComplete : "";
        return <button key={subject.id} type="button" className={styles.subjectCard} disabled={pendingId !== null} onClick={() => openSubject(subject.id)}>
          {label && <span className={`${styles.subjectStatus} ${statusClass}`}>{label}</span>}
          <span className={styles.subjectTitle}>{subject.title}</span>
          {subject.description && <span className={styles.subjectDescription}>{subject.description}</span>}
          {action && <span className={styles.subjectAction}>{action}</span>}
        </button>;
      })}
    </div>
    {error && <p className={styles.actionError} role="alert">{error}</p>}
  </>;
}
