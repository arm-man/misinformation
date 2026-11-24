import "server-only";

import { pool } from "./db";

export async function saveGeneralFeedback(studentId: number, message: string): Promise<void> {
  await pool.query("INSERT INTO general_feedback (student_id, feedback) VALUES ($1, $2)", [studentId, message]);
}

export async function canGiveQuestionFeedback(studentId: number, questionId: number): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM session_questions
     JOIN sessions ON sessions.id = session_questions.session_id
     WHERE sessions.student_id = $1 AND sessions.completed_at IS NOT NULL
       AND session_questions.question_id = $2 LIMIT 1`,
    [studentId, questionId],
  );
  return Boolean(result.rowCount);
}

export async function saveQuestionFeedback(studentId: number, questionId: number, message: string): Promise<void> {
  await pool.query(
    "INSERT INTO question_feedback (student_id, question_id, feedback) VALUES ($1, $2, $3)",
    [studentId, questionId, message],
  );
}
