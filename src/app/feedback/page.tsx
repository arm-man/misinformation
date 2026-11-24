import { cookies } from "next/headers";
import PublicHeader from "@/app/PublicHeader";
import EmailForm from "@/app/EmailForm";
import styles from "@/app/public.module.css";
import { findStudent, STUDENT_COOKIE_NAME } from "@/server/students";
import { withPublicPageLogging } from "@/server/public-log";
import FeedbackForm from "./FeedbackForm";

export const runtime = "nodejs";

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ emailSaved?: string }> }) {
  const key = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  const student = await withPublicPageLogging("Loading Feedback identity failed", () => findStudent(key));
  const saved = (await searchParams).emailSaved === "1";
  return <><PublicHeader /><main className={styles.main}>
    <span className={styles.eyebrow}>Your thoughts matter</span>
    <h1 className={styles.title}>Give feedback</h1>
    <p className={styles.lead}>We would love to hear what worked, what could be clearer, or what you would like to examine next.</p>
    {saved && student?.email && <p className={styles.success} role="status">Your email has been saved. We’ll notify you when new subjects are available.</p>}
    {!student?.email && <div className={styles.panel}>
      <p className={styles.muted}>Add an email address to receive a response about your feedback.</p>
      <EmailForm returnTo="/feedback" />
    </div>}
    <FeedbackForm isGuest={!student?.email} />
  </main></>;
}
