import { hasAdminAccess } from "@/server/admin-auth";
import { getAdminSubjects } from "@/server/admin-data";
import { unexpectedAdminError } from "@/server/admin-http";
import type { Subject } from "@/lib/admin-types";
import AdminEditor from "./AdminEditor";
import AdminLogin from "./AdminLogin";
import styles from "./admin.module.css";

export const runtime = "nodejs";

export default async function AdminPage() {
  // Keep Next.js's dynamic rendering signal from cookies() outside the data catch.
  const hasAccess = await hasAdminAccess();
  if (!hasAccess) return <AdminLogin />;

  let subjects: Subject[] = [];
  let failed = false;
  try {
    subjects = await getAdminSubjects();
  } catch (error) {
    await unexpectedAdminError("Loading the Administration page failed", error);
    failed = true;
  }
  if (failed) return (
    <main className={styles.shell}>
      <div className={styles.panel} role="alert">
        <h1>Administration</h1>
        <p>Something went wrong. Please try again.</p>
      </div>
    </main>
  );
  return <AdminEditor subjects={subjects} />;
}
