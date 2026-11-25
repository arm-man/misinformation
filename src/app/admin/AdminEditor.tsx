"use client";

import { useState, type FormEvent } from "react";
import type { Question, QuestionInput, QuestionTitle, Subject } from "@/lib/admin-types";
import styles from "./admin.module.css";

const EMPTY_QUESTION: QuestionInput = {
  short_title: "", question_text: "", choice1: "", choice2: "",
  choice3: null, choice4: null, answer: 0,
  explanation: "", why_it_spreads: "", sources: "", is_active: true,
};

type Draft = Omit<QuestionInput, "choice3" | "choice4"> & { choice3: string; choice4: string };

function draftFrom(question: QuestionInput): Draft {
  return {
    short_title: question.short_title,
    question_text: question.question_text,
    choice1: question.choice1,
    choice2: question.choice2,
    choice3: question.choice3 ?? "",
    choice4: question.choice4 ?? "",
    answer: question.answer,
    explanation: question.explanation,
    why_it_spreads: question.why_it_spreads,
    sources: question.sources,
    is_active: question.is_active,
  };
}

function hasChanges(draft: Draft, baseline: Draft): boolean {
  return Object.keys(baseline).some((field) =>
    draft[field as keyof Draft] !== baseline[field as keyof Draft]);
}

async function responseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.error?.message ?? "The request failed. Please try again.";
  } catch {
    return "The request failed. Please try again.";
  }
}

export default function AdminEditor({ subjects, initialQuestionTitles }: {
  subjects: Subject[];
  initialQuestionTitles: QuestionTitle[];
}) {
  const [questionTitles, setQuestionTitles] = useState(initialQuestionTitles);
  const [subjectId, setSubjectId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [position, setPosition] = useState(-1);
  const [draft, setDraft] = useState<Draft>(draftFrom(EMPTY_QUESTION));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const isNew = position === questions.length;
  const currentQuestion = position >= 0 && !isNew ? questions[position] : null;
  const baseline = draftFrom(currentQuestion ?? EMPTY_QUESTION);
  const isDirty = hasChanges(draft, baseline);
  const isLocked = pending || isDirty || saveFailed;

  function showPosition(nextPosition: number) {
    setPosition(nextPosition);
    setDraft(draftFrom(questions[nextPosition] ?? EMPTY_QUESTION));
    setError("");
    setSaveFailed(false);
  }

  async function selectSubject(value: string, questionId?: number) {
    if (isLocked) return;
    setSubjectId(value);
    setQuestions([]);
    setPosition(-1);
    setDraft(draftFrom(EMPTY_QUESTION));
    setError("");
    setSaveFailed(false);
    if (!value) return;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/subjects/${value}/questions`, { cache: "no-store" });
      if (!response.ok) {
        setSubjectId("");
        setError(await responseError(response));
        return;
      }
      const loaded: Question[] = await response.json();
      setQuestions(loaded);
      // The directory opens the chosen Question; the dropdown still opens the last one.
      const nextPosition = questionId === undefined
        ? Math.max(0, loaded.length - 1)
        : loaded.findIndex((question) => question.id === questionId);
      if (nextPosition === -1) {
        setSubjectId("");
        setError("That Question is no longer available. Please reload the page.");
        return;
      }
      setPosition(nextPosition);
      setDraft(draftFrom(loaded[nextPosition] ?? EMPTY_QUESTION));
    } catch {
      setSubjectId("");
      setError("Could not load Questions. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function changeText(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDirty || pending || !subjectId) return;
    setPending(true);
    setError("");
    const url = isNew
      ? `/api/admin/subjects/${subjectId}/questions`
      : `/api/admin/questions/${currentQuestion?.id}`;
    try {
      const response = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) {
        setError(await responseError(response));
        setSaveFailed(true);
        return;
      }
      const saved: Question = await response.json();
      // Keep the directory current when returning to the unselected Subject view.
      setQuestionTitles((current) => [
        ...current.filter((question) => question.id !== saved.id),
        { id: saved.id, subject_id: saved.subject_id, short_title: saved.short_title },
      ].sort((first, second) => first.id - second.id));
      if (isNew) {
        setQuestions((current) => [...current, saved]);
        setPosition(questions.length);
      } else {
        setQuestions((current) => current.map((question) => question.id === saved.id ? saved : question));
      }
      setDraft(draftFrom(saved));
      setSaveFailed(false);
    } catch {
      setError("Could not save the Question. Please try again.");
      setSaveFailed(true);
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) {
        setError(await responseError(response));
        return;
      }
      window.location.replace("/admin");
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.shell}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Misinformation Examination</p>
            <h1>Administration</h1>
          </div>
          <button type="button" className={styles.secondary} onClick={signOut} disabled={pending}>Sign out</button>
        </header>

        <div className={styles.subjectRow}>
          <label htmlFor="admin-subject">Subject</label>
          <select id="admin-subject" value={subjectId} disabled={isLocked}
            onChange={(event) => void selectSubject(event.target.value)}>
            <option value="">Select a Subject</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}
          </select>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {pending && position === -1 && <p className={styles.muted}>Loading Questions…</p>}

        {!subjectId && (
          <section className={styles.directory} aria-label="Questions by Subject">
            {subjects.map((subject) => {
              const titles = questionTitles.filter((question) => question.subject_id === subject.id);
              return (
                <section key={subject.id} className={styles.subjectGroup} aria-labelledby={`subject-${subject.id}`}>
                  <h2 id={`subject-${subject.id}`}>{subject.title}</h2>
                  {titles.length === 0 ? <p className={styles.muted}>No Questions yet.</p> : (
                    <ul className={styles.questionList}>
                      {titles.map((question) => (
                        <li key={question.id}>
                          <button type="button" className={styles.questionTitle} disabled={isLocked}
                            onClick={() => void selectSubject(String(subject.id), question.id)}>
                            {question.short_title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </section>
        )}

        {subjectId && position >= 0 && (
          <form onSubmit={save}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>{isNew ? "New Question" : `Question ${position + 1} of ${questions.length}`}</p>
                <h2>{isNew ? "Create a Question" : "Edit Question"}</h2>
              </div>
              <span className={styles.badge}>{isNew ? "Unsaved row" : `ID ${currentQuestion?.id}`}</span>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="question-id">ID</label>
                <input id="question-id" value={currentQuestion?.id ?? "Assigned on save"} readOnly />
              </div>
              <div className={styles.field}>
                <label htmlFor="subject-id">Subject ID</label>
                <input id="subject-id" value={subjectId} readOnly />
              </div>
              <TextField label="Short title" field="short_title" value={draft.short_title} onChange={changeText} />
              <TextField label="Question text" field="question_text" value={draft.question_text} onChange={changeText} multiline />
              <TextField label="Choice 1" field="choice1" value={draft.choice1} onChange={changeText} />
              <TextField label="Choice 2" field="choice2" value={draft.choice2} onChange={changeText} />
              <TextField label="Choice 3 (optional)" field="choice3" value={draft.choice3} onChange={changeText} />
              <TextField label="Choice 4 (optional)" field="choice4" value={draft.choice4} onChange={changeText} />
              <div className={styles.field}>
                <label htmlFor="answer">Answer</label>
                <select id="answer" value={draft.answer} onChange={(event) => {
                  setDraft((current) => ({ ...current, answer: Number(event.target.value) }));
                  setError("");
                }}>
                  <option value={0}>Select the correct Choice</option>
                  {[1, 2, 3, 4].map((number) => <option key={number} value={number}>Choice {number}</option>)}
                </select>
              </div>
              <TextField label="Explanation" field="explanation" value={draft.explanation} onChange={changeText} multiline />
              <TextField label="Why it spreads" field="why_it_spreads" value={draft.why_it_spreads} onChange={changeText} multiline />
              <TextField label="Sources" field="sources" value={draft.sources} onChange={changeText} multiline />
              <div className={styles.checkboxRow}>
                <input id="is-active" type="checkbox" checked={draft.is_active} onChange={(event) => {
                  setDraft((current) => ({ ...current, is_active: event.target.checked }));
                  setError("");
                }} />
                <label htmlFor="is-active">Active for new Sessions</label>
              </div>
            </div>

            <div className={styles.actions}>
              <div className={styles.navigation}>
                <button type="button" className={styles.secondary} disabled={isLocked || (isNew ? questions.length === 0 : position === 0)}
                  onClick={() => showPosition(isNew ? questions.length - 1 : position - 1)}>Previous</button>
                <button type="button" className={styles.secondary} disabled={isLocked || isNew}
                  onClick={() => showPosition(position + 1)}>Next</button>
              </div>
              <div className={styles.navigation}>
                <button type="button" className={styles.secondary} disabled={(!isDirty && !saveFailed) || pending}
                  onClick={() => { setDraft(baseline); setError(""); setSaveFailed(false); }}>Cancel</button>
                <button type="submit" disabled={!isDirty || pending}>{pending ? "Saving…" : "Save"}</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function TextField({ label, field, value, onChange, multiline = false }: {
  label: string;
  field: keyof Draft;
  value: string;
  onChange: (field: keyof Draft, value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className={`${styles.field} ${multiline ? styles.wide : ""}`}>
      <label htmlFor={field}>{label}</label>
      {multiline
        ? <textarea id={field} value={value} rows={4} onChange={(event) => onChange(field, event.target.value)} />
        : <input id={field} value={value} onChange={(event) => onChange(field, event.target.value)} />}
    </div>
  );
}
