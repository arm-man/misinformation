import "server-only";

import { createStudent, findStudent } from "./students";
import { createSessionWithQuestions, findSession, getActiveQuestionIds } from "./session-data";

export async function startOrResumeSession(subjectId: number, key: string | undefined): Promise<
  { status: "subject-not-found" } |
  { status: "ok"; sessionId: number; created: boolean; newKey: string | null }
> {
  const knownStudent = await findStudent(key);
  if (knownStudent) {
    const existing = await findSession(knownStudent.id, subjectId);
    if (existing) return { status: "ok", sessionId: existing.id, created: false, newKey: null };
  }
  const questionIds = await getActiveQuestionIds(subjectId);
  if (questionIds === null || questionIds.length === 0) return { status: "subject-not-found" };
  const student = knownStudent ?? await createStudent();

  // The Session's Question list is fixed at creation, even if an administrator edits the Subject later.
  const randomized = [...questionIds];
  for (let index = randomized.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [randomized[index], randomized[other]] = [randomized[other], randomized[index]];
  }
  const session = await createSessionWithQuestions(student.id, subjectId, randomized);
  return { status: "ok", ...session, newKey: knownStudent ? null : student.key };
}
