import "server-only";

import type { LandingSubject } from "@/lib/landing-types";
import { pool } from "./db";
import { findStudent } from "./students";

type SubjectRow = {
  id: number;
  title: string;
  completed_at: Date | null;
  session_id: number | null;
};

export async function getLandingData(key: string | undefined): Promise<{
  subjects: LandingSubject[];
  hasEmail: boolean;
}> {
  const student = await findStudent(key);
  const result = await pool.query<SubjectRow>(
    `SELECT subjects.id, subjects.title, sessions.id AS session_id, sessions.completed_at
     FROM subjects
     LEFT JOIN sessions ON sessions.subject_id = subjects.id AND sessions.student_id = $1
     WHERE subjects.is_active = true AND (
       EXISTS (
         SELECT 1 FROM questions
         WHERE questions.subject_id = subjects.id AND questions.is_active = true
       ) OR sessions.id IS NOT NULL
     )
     ORDER BY subjects.title, subjects.id`,
    [student?.id ?? null],
  );
  const subjects = result.rows.map((row): LandingSubject => ({
    id: row.id,
    title: row.title,
    status: row.session_id === null ? "not-started" :
      row.completed_at === null ? "in-progress" : "complete",
  }));
  return { subjects, hasEmail: Boolean(student?.email) };
}
