import { cookies } from "next/headers";
import { getLandingData } from "@/server/landing-data";
import { writePublicLog } from "@/server/public-log";
import { STUDENT_COOKIE_NAME } from "@/server/students";
import type { LandingSubject } from "@/lib/landing-types";
import EmailForm from "./EmailForm";
import ShareLink from "./ShareLink";
import SubjectList from "./SubjectList";
import styles from "./page.module.css";

export const runtime = "nodejs";

export default async function Home({ searchParams }: { searchParams: Promise<{ emailSaved?: string }> }) {
  const key = (await cookies()).get(STUDENT_COOKIE_NAME)?.value;
  let subjects: LandingSubject[] = [];
  let hasEmail = false;
  let loadFailed = false;
  try {
    const data = await getLandingData(key);
    subjects = data.subjects;
    hasEmail = data.hasEmail;
  } catch (error) {
    const kind = error instanceof Error ? error.name : "UnknownError";
    await writePublicLog(`Loading the Landing Page failed: ${kind}`, "error");
    loadFailed = true;
  }
  const emailSaved = (await searchParams).emailSaved === "1";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        {/* A full navigation reloads the Landing Page when its wordmark is clicked here. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={styles.wordmark} aria-label="Misinformation Examination home">
          <span className={styles.wordmarkIcon} aria-hidden="true">?</span>
          <span>Misinformation <strong>Examination</strong></span>
        </a>
      </header>

      <main>
        {emailSaved && hasEmail && <p className={styles.savedNotice} role="status">Your email has been saved. We’ll notify you when new subjects are available.</p>}
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>A closer look at what we believe</span>
            <h1 id="hero-title">Can <em>you</em> identify fake news?</h1>
            <p>Misinformation shows up everywhere, from social media to mainstream news. Many people fall for these false claims and believe them without checking the facts. But you&apos;re different. Or are you?</p>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.artCircleOuter}><div className={styles.artCircleMiddle}><div className={styles.artCircleInner}>?</div></div></div>
            <span className={styles.artCaption}>Notice. Reflect. Learn.</span>
          </div>
        </section>

        <section id="examinations" className={styles.examinations} aria-labelledby="examinations-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Begin your examination</span>
              <h2 id="examinations-title">Choose a subject</h2>
            </div>
            <p>Pick a topic and answer a series of questions. You can leave and come back to an examination in progress.</p>
          </div>
          {loadFailed ? <p className={styles.loadError} role="alert">Examinations are temporarily unavailable. Please try again shortly.</p> : <SubjectList subjects={subjects} />}
        </section>

        {!loadFailed && !hasEmail && <EmailForm />}
        <ShareLink afterEmail={!loadFailed && !hasEmail} />

        <section id="about" className={styles.about} aria-labelledby="about-title">
          <div className={styles.aboutLabel}><span className={styles.eyebrow}>The reason behind this</span><div className={styles.aboutRule} /></div>
          <div className={styles.aboutCopy}>
            <h2 id="about-title">Truth takes a second look.</h2>
            <p>We encounter claims every day through conversations, headlines, and the media we trust. Some sound convincing because they fit what we already think. Others are repeated so often that we stop questioning them.</p>
            <p>Misinformation Examination is a place to test those assumptions with questions about commonly held misconceptions, especially in politics and media. The goal is curiosity, not a score to define you.</p>
            <p>You may have heard that emotions change minds and facts do not. We believe facts can change minds, especially when we take time to check the sources, consider the context, and question what we thought we knew. That is why every examination is an invitation to look again.</p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}><span>Misinformation Examination</span><span>A little more curiosity, a little less certainty.</span></footer>
    </div>
  );
}
