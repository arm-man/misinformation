"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExaminationQuestion } from "@/lib/session-types";
import publicStyles from "@/app/public.module.css";
import styles from "./session.module.css";

export default function Examination({ sessionId, title, initialQuestions }: {
  sessionId: number; title: string; initialQuestions: ExaminationQuestion[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(() => {
    const first = initialQuestions.findIndex((question) => question.guess === null);
    return first === -1 ? Math.max(0, initialQuestions.length - 1) : first;
  });
  const [selection, setSelection] = useState<{ id: number; choice: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const question = questions[index];
  const recorded = questions.filter((item) => item.guess !== null).length;
  const answered = questions.filter((item) => item.guess !== null && item.guess !== 0).length;
  const skipped = questions.filter((item) => item.guess === 0).length;
  const selected = selection?.id === question?.id ? selection.choice : question?.guess;

  async function choose(choice: number) {
    if (!question || pending) return;
    const isFirstGuess = question.guess === null;
    setSelection({ id: question.id, choice });
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${sessionId}/questions/${question.id}/guess`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ choice }),
      });
      if (!response.ok) throw new Error("Your answer could not be saved. Please try again.");
      setQuestions((current) => current.map((item) => item.id === question.id ? { ...item, guess: choice } : item));
      setSelection(null);
      if (isFirstGuess && index < questions.length - 1) setIndex(index + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your answer could not be saved. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    if (pending || recorded !== questions.length) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/sessions/${sessionId}/complete`, { method: "POST" });
      if (!response.ok) throw new Error("The examination could not be finished. Please try again.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The examination could not be finished. Please try again.");
      setPending(false);
    }
  }

  if (!question) return <p className={publicStyles.error}>This examination has no questions.</p>;
  return <>
    <section className={styles.summaryCard} aria-labelledby="subject-heading">
      <h1 id="subject-heading" className={`${publicStyles.title} ${styles.examinationTitle}`}>{title}</h1>
      <p className={styles.progress}>{answered} of {questions.length} answered · {skipped} skipped</p>
      <div className={styles.progressTrack} role="progressbar" aria-label="Examination progress" aria-valuenow={recorded} aria-valuemin={0} aria-valuemax={questions.length}>
        <div style={{ width: `${recorded / questions.length * 100}%` }} />
      </div>
    </section>
    <section className={styles.questionCard} aria-labelledby="question-heading">
      <h2 id="question-heading" className={styles.questionText}>{question.text}</h2>
      <fieldset className={styles.choices} disabled={pending}>
        <legend className={styles.srOnly}>Choose one answer</legend>
        {question.choices.map((choice, choiceIndex) => <label key={choiceIndex} className={`${styles.choice} ${selected === choiceIndex + 1 ? styles.choiceSelected : ""}`}>
          <input type="radio" name={`question-${question.id}`} checked={selected === choiceIndex + 1} onChange={() => choose(choiceIndex + 1)} />
          <span>{choice}</span>
        </label>)}
        <label className={`${styles.choice} ${styles.skipChoice} ${selected === 0 ? styles.choiceSelected : ""}`}>
          <input type="radio" name={`question-${question.id}`} checked={selected === 0} onChange={() => choose(0)} />
          <span>I don’t know / Skip</span>
        </label>
      </fieldset>
      {error && <p className={publicStyles.error} role="alert">{error}</p>}
    </section>
    <nav className={styles.navigation} aria-label="Question navigation">
      <div>{index > 0 && <button className={publicStyles.secondaryButton} disabled={pending} onClick={() => { setIndex(index - 1); setSelection(null); setError(""); }}>Previous</button>}</div>
      <div>{recorded === questions.length && <button className={publicStyles.button} disabled={pending} onClick={finish}>{pending ? "Finishing…" : "Finish Examination"}</button>}</div>
      <div>{question.guess !== null && index < questions.length - 1 && <button className={publicStyles.secondaryButton} disabled={pending} onClick={() => { setIndex(index + 1); setSelection(null); setError(""); }}>Next</button>}</div>
    </nav>
  </>;
}
