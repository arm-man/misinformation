import "server-only";

import { pool } from "./db";

type GuessError = "SESSION_NOT_FOUND" | "SESSION_FORBIDDEN" |
  "QUESTION_NOT_FOUND" | "CHOICE_OUT_OF_BOUNDS" | "SESSION_ALREADY_COMPLETED";
type CompletionError = "SESSION_NOT_FOUND" | "SESSION_FORBIDDEN" | "SESSION_INCOMPLETE";

export async function saveGuess(studentId: number, sessionId: number, questionId: number, choice: number): Promise<GuessError | null> {
  const client = await pool.connect();
  let committed = false;
  try {
    await client.query("BEGIN");
    // Lock the Session so completion cannot race with a Guess update.
    const session = await client.query<{ student_id: number; completed_at: Date | null }>(
      "SELECT student_id, completed_at FROM sessions WHERE id = $1 FOR UPDATE", [sessionId],
    );
    if (!session.rows[0]) return "SESSION_NOT_FOUND";
    if (session.rows[0].student_id !== studentId) return "SESSION_FORBIDDEN";
    if (session.rows[0].completed_at !== null) return "SESSION_ALREADY_COMPLETED";
    const question = await client.query<{ choice1: string; choice2: string; choice3: string | null; choice4: string | null }>(
      `SELECT questions.choice1, questions.choice2, questions.choice3, questions.choice4
       FROM session_questions JOIN questions ON questions.id = session_questions.question_id
       WHERE session_questions.session_id = $1 AND session_questions.question_id = $2`,
      [sessionId, questionId],
    );
    if (!question.rows[0]) return "QUESTION_NOT_FOUND";
    const row = question.rows[0];
    if (choice !== 0 && [row.choice1, row.choice2, row.choice3, row.choice4][choice - 1] == null) return "CHOICE_OUT_OF_BOUNDS";
    await client.query(
      "UPDATE session_questions SET choice = $3 WHERE session_id = $1 AND question_id = $2",
      [sessionId, questionId, choice],
    );
    await client.query("COMMIT");
    committed = true;
    return null;
  } finally {
    try {
      if (!committed) await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}

export async function completeSession(studentId: number, sessionId: number): Promise<{ error: CompletionError | null; completedNow: boolean }> {
  const client = await pool.connect();
  let committed = false;
  try {
    await client.query("BEGIN");
    const session = await client.query<{ student_id: number; completed_at: Date | null }>(
      "SELECT student_id, completed_at FROM sessions WHERE id = $1 FOR UPDATE", [sessionId],
    );
    if (!session.rows[0]) return { error: "SESSION_NOT_FOUND", completedNow: false };
    if (session.rows[0].student_id !== studentId) return { error: "SESSION_FORBIDDEN", completedNow: false };
    if (session.rows[0].completed_at !== null) return { error: null, completedNow: false };
    const incomplete = await client.query(
      "SELECT 1 FROM session_questions WHERE session_id = $1 AND choice IS NULL LIMIT 1", [sessionId],
    );
    if (incomplete.rowCount) return { error: "SESSION_INCOMPLETE", completedNow: false };
    await client.query("UPDATE sessions SET completed_at = NOW() WHERE id = $1", [sessionId]);
    await client.query("COMMIT");
    committed = true;
    return { error: null, completedNow: true };
  } finally {
    try {
      if (!committed) await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}
