import styles from "./public.module.css";

export default function PublicHeader() {
  return <header className={styles.header}>
    {/* A full navigation refreshes the Student's Subject statuses on the Landing Page. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <a href="/" className={styles.wordmark}>
      <span className={styles.mark} aria-hidden="true">?</span>
      <span>Misinformation <strong>Examination</strong></span>
    </a>
  </header>;
}
