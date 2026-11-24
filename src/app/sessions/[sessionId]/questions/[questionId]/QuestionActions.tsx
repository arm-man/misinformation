"use client";

import { useState } from "react";
import styles from "@/app/public.module.css";

export default function QuestionActions({ questionId, questionText, choices, section }: { questionId: number; questionText: string; choices: string[]; section: "ai" | "feedback" }) {
  const [reportIssue, setReportIssue] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedProvider, setCopiedProvider] = useState("");
  const aiPrompt = `Please answer the question: "${questionText}" with one of these choices:\n${choices.map((choice, index) => `${String.fromCharCode(65 + index)}. ${choice}`).join("\n")}`;

  async function copyQuestion() {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setCopied(true);
    } catch {
      setError("Could not copy the question. Please select and copy it instead.");
    }
  }

  async function openProvider(name: string, url: string, canPrefill: boolean) {
    if (canPrefill) {
      window.open(`${url}?q=${encodeURIComponent(aiPrompt)}`, "_blank", "noopener,noreferrer");
      return;
    }
    // Start copying while the click still has user activation, before the new tab takes focus.
    const copy = navigator.clipboard.writeText(aiPrompt);
    window.open(url, "_blank", "noopener,noreferrer");
    try {
      await copy;
      setCopiedProvider(name);
      setError("");
    } catch {
      setError("Could not copy the question. Please use Copy question, then paste it into the AI website.");
    }
  }

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (message.trim().length < 5 || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/questions/${questionId}/feedback`, {
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

  return <>
    {section === "ai" && <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>Ask AI about this question</h2>
      <div className={styles.aiButtons}>
        <button className={styles.secondaryButton} type="button" onClick={() => openProvider("ChatGPT", "https://chatgpt.com/", true)}>ChatGPT</button>
        <button className={styles.secondaryButton} type="button" onClick={() => openProvider("Gemini", "https://gemini.google.com/app", false)}>Gemini</button>
        <button className={styles.secondaryButton} type="button" onClick={() => openProvider("Claude", "https://claude.ai/new", false)}>Claude</button>
        <button className={styles.secondaryButton} type="button" onClick={() => openProvider("Grok", "https://grok.com/", false)}>Grok</button>
        <button className={styles.secondaryButton} type="button" onClick={() => openProvider("Perplexity", "https://www.perplexity.ai/", false)}>Perplexity</button>
        <button className={styles.secondaryButton} type="button" onClick={copyQuestion}>{copied ? "Question copied" : "Copy question"}</button>
      </div>
      {copiedProvider && <p className={styles.success} role="status">Question copied. Paste it into {copiedProvider}.</p>}
    </section>}
    {section === "feedback" && <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>Question feedback</h2>
      <label className={styles.toggleLabel}>
        <input type="checkbox" role="switch" checked={reportIssue} onChange={(event) => setReportIssue(event.target.checked)} />
        Report an issue with this question
      </label>
      {reportIssue && (submitted ? <p className={styles.success} role="status">Thank you for your feedback.</p> :
        <form onSubmit={submitFeedback}>
          <p className={styles.muted}>Please describe the issue clearly and include details that will help us review it.</p>
          <textarea className={styles.feedbackArea} aria-label="Question feedback" value={message} onChange={(event) => setMessage(event.target.value)} />
          <div className={styles.formAction}><button className={styles.button} type="submit" disabled={message.trim().length < 5 || pending}>{pending ? "Submitting…" : "Submit"}</button></div>
        </form>)}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>}
  </>;
}
