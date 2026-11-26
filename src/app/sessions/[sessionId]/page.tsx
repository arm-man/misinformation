import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PublicHeader from "@/app/PublicHeader";
import EmailForm from "@/app/EmailForm";
import styles from "@/app/public.module.css";
import { loadExaminationQuestions, loadResultQuestions, loadSession } from "@/server/session-data";
import { withPublicPageLogging } from "@/server/public-log";
import { findStudent, STUDENT_COOKIE_NAME } from "@/server/students";
import Examination from "./Examination";
import sessionStyles from "./session.module.css";

export const runtime = "nodejs";

export default async function SessionPage({ params, searchParams }: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ emailSaved?: string }>;
}) {
  const { sessionId: rawId } = await params;
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(Number(rawId))) notFound();
  const key = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  const student = await withPublicPageLogging("Loading Session identity failed", () => findStudent(key));
  if (!student) redirect("/");
  const session = await withPublicPageLogging("Loading Session details failed", () => loadSession(Number(rawId)));
  if (!session || session.student_id !== student.id) notFound();

  if (session.completed_at === null) {
    const questions = await withPublicPageLogging("Loading examination Questions failed", () => loadExaminationQuestions(session.id));
    return <><PublicHeader /><main className={`${styles.main} ${sessionStyles.examinationMain}`}>
      <Examination sessionId={session.id} title={session.title} initialQuestions={questions} />
    </main></>;
  }

  const questions = await withPublicPageLogging("Loading Session results failed", () => loadResultQuestions(session.id));
  const correct = questions.filter((question) => question.guess === question.answer).length;
  const skipped = questions.filter((question) => question.guess === 0).length;
  const incorrect = questions.length - correct - skipped;
  const saved = (await searchParams).emailSaved === "1";
  return <><PublicHeader /><main className={styles.main}>
    <span className={styles.eyebrow}>Examination complete</span>
    <h1 className={styles.title}>{session.title}</h1>
    <p className={styles.lead}>Your examination ended on {new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(session.completed_at)}.</p>
    <div className={styles.stats} aria-label="Results summary">
      <div className={styles.stat}><strong>{correct}</strong><span>Correct</span></div>
      <div className={styles.stat}><strong>{incorrect}</strong><span>Incorrect</span></div>
      <div className={styles.stat}><strong>{skipped}</strong><span>Skipped</span></div>
    </div>
    <section aria-labelledby="results-title">
      <h2 id="results-title" className={styles.sectionTitle}>Your answers</h2>
      <div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th>Question</th><th>Answer</th><th>Guess</th></tr></thead>
        <tbody>{questions.map((question) => {
          const href = `/sessions/${session.id}/questions/${question.id}`;
          const guess = question.guess === 0 ? "Skipped" : question.guess === null ? "Not answered" : question.choices[question.guess - 1];
          const wrong = question.guess !== null && question.guess !== 0 && question.guess !== question.answer;
          return <tr key={question.id} className={wrong ? styles.incorrect : undefined}>
            <td><Link href={href}>{question.shortTitle}</Link></td>
            <td><Link href={href}>{question.choices[question.answer - 1]}</Link></td>
            <td><Link href={href}>{guess}</Link></td>
          </tr>;
        })}</tbody>
      </table></div>
    </section>
    <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>We would love to hear from you</h2>
      <p className={styles.lead}>Tell us what you thought about this examination or suggest a topic for the future.</p>
      <Link className={styles.button} href="/feedback">Give feedback</Link>
    </section>
    {saved && <p className={styles.success} role="status">Your email has been saved. We’ll notify you when new subjects are available.</p>}
    {!student.email && <EmailForm returnTo={`/sessions/${session.id}`} />}
  </main></>;
}
