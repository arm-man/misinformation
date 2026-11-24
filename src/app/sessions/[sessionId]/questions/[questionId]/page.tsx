import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PublicHeader from "@/app/PublicHeader";
import MarkdownLinks from "@/app/MarkdownLinks";
import styles from "@/app/public.module.css";
import { loadQuestionDetail, loadSession } from "@/server/session-data";
import { withPublicPageLogging } from "@/server/public-log";
import { findStudent, STUDENT_COOKIE_NAME } from "@/server/students";
import QuestionActions from "./QuestionActions";

export const runtime = "nodejs";

export default async function QuestionPage({ params }: {
  params: Promise<{ sessionId: string; questionId: string }>;
}) {
  const { sessionId, questionId } = await params;
  if (!/^[1-9]\d*$/.test(sessionId) || !/^[1-9]\d*$/.test(questionId) ||
      !Number.isSafeInteger(Number(sessionId)) || !Number.isSafeInteger(Number(questionId))) notFound();
  const key = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  const student = await withPublicPageLogging("Loading Question identity failed", () => findStudent(key));
  if (!student) redirect("/");
  const session = await withPublicPageLogging("Loading Question Session failed", () => loadSession(Number(sessionId)));
  if (!session || session.student_id !== student.id) notFound();
  if (session.completed_at === null) redirect(`/sessions/${sessionId}`);
  const question = await withPublicPageLogging("Loading Question details failed", () => loadQuestionDetail(session.id, Number(questionId)));
  if (!question) notFound();

  return <><PublicHeader /><main className={styles.main}>
    <Link className={styles.back} href={`/sessions/${sessionId}`}>Back to results</Link>
    <span className={styles.questionSubject}>{session.title}</span>
    <h1 className={styles.questionTitle}>{question.text}</h1>
    <div className={styles.stats}>
      <div className={styles.stat}><span>Answer</span><strong className={styles.answerText}>{question.answer}</strong></div>
      <div className={styles.stat}><span>Your guess</span><strong className={styles.answerText}>{question.guess}</strong></div>
    </div>
    <QuestionActions questionId={Number(questionId)} questionText={question.text} choices={question.choices} section="ai" />
    <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>Why this is the answer</h2>
      <p className={styles.prose}><MarkdownLinks text={question.explanation} /></p>
    </section>
    <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>Why this misconception spreads</h2>
      <p className={styles.prose}><MarkdownLinks text={question.whyItSpreads} /></p>
    </section>
    <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>Sources</h2>
      <p className={styles.prose}><MarkdownLinks text={question.sources} /></p>
    </section>
    <QuestionActions questionId={Number(questionId)} questionText={question.text} choices={question.choices} section="feedback" />
  </main></>;
}
