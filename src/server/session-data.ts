import "server-only";

import { pool } from "./db";
import type { ExaminationQuestion, ResultQuestion } from "@/lib/session-types";

type SessionRow = { id: number; completed_at: Date | null };
type QuestionRow = { id: number };
type SessionDetailsRow = { id: number; student_id: number; title: string; completed_at: Date | null };
type SessionQuestionRow = {
  id: number; position: number; choice: number | null; short_title: string; question_text: string;
  choice1: string; choice2: string; choice3: string | null; choice4: string | null; answer: number;
};

export async function loadSession(sessionId: number): Promise<SessionDetailsRow | null> {
  const result = await pool.query<SessionDetailsRow>(
    `SELECT sessions.id, sessions.student_id, subjects.title, sessions.completed_at
     FROM sessions JOIN subjects ON subjects.id = sessions.subject_id WHERE sessions.id = $1`,
    [sessionId],
  );
  return result.rows[0] ?? null;
}

async function loadQuestionRows(sessionId: number): Promise<SessionQuestionRow[]> {
  const result = await pool.query<SessionQuestionRow>(
    `SELECT questions.id, session_questions.position, session_questions.choice,
       questions.short_title, questions.question_text, questions.choice1, questions.choice2,
       questions.choice3, questions.choice4, questions.answer
     FROM session_questions JOIN questions ON questions.id = session_questions.question_id
     WHERE session_questions.session_id = $1 ORDER BY session_questions.position`,
    [sessionId],
  );
  return result.rows;
}

function publicQuestion(row: SessionQuestionRow): ExaminationQuestion {
  return {
    id: row.id, position: row.position, text: row.question_text,
    choices: [row.choice1, row.choice2, row.choice3, row.choice4].filter((choice): choice is string => choice !== null),
    guess: row.choice,
  };
}

export async function loadExaminationQuestions(sessionId: number): Promise<ExaminationQuestion[]> {
  return (await loadQuestionRows(sessionId)).map(publicQuestion);
}

export async function loadResultQuestions(sessionId: number): Promise<ResultQuestion[]> {
  return (await loadQuestionRows(sessionId)).map((row) => ({
    ...publicQuestion(row), shortTitle: row.short_title, answer: row.answer,
  }));
}

export async function loadQuestionDetail(sessionId: number, questionId: number) {
  const result = await pool.query<{
    question_text: string; choice: number | null; answer: number; choice1: string; choice2: string;
    choice3: string | null; choice4: string | null; explanation: string; why_it_spreads: string; sources: string;
  }>(
    `SELECT questions.question_text, session_questions.choice, questions.answer,
       questions.choice1, questions.choice2, questions.choice3, questions.choice4,
       questions.explanation, questions.why_it_spreads, questions.sources
     FROM session_questions JOIN questions ON questions.id = session_questions.question_id
     WHERE session_questions.session_id = $1 AND session_questions.question_id = $2`,
    [sessionId, questionId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const choices = [row.choice1, row.choice2, row.choice3, row.choice4];
  return {
    text: row.question_text, answer: choices[row.answer - 1],
    guess: row.choice === 0 ? "Skipped" : row.choice === null ? "Not answered" : choices[row.choice - 1],
    choices: choices.filter((choice): choice is string => choice !== null),
    explanation: row.explanation, whyItSpreads: row.why_it_spreads, sources: row.sources,
  };
}

export async function findSession(studentId: number, subjectId: number): Promise<SessionRow | null> {
  const result = await pool.query<SessionRow>(
    "SELECT id, completed_at FROM sessions WHERE student_id = $1 AND subject_id = $2",
    [studentId, subjectId],
  );
  return result.rows[0] ?? null;
}

export async function getActiveQuestionIds(subjectId: number): Promise<number[] | null> {
  const subject = await pool.query("SELECT 1 FROM subjects WHERE id = $1", [subjectId]);
  if (!subject.rowCount) return null;
  const result = await pool.query<QuestionRow>(
    "SELECT id FROM questions WHERE subject_id = $1 AND is_active = true ORDER BY id",
    [subjectId],
  );
  return result.rows.map((row) => row.id);
}

export async function createSessionWithQuestions(
  studentId: number,
  subjectId: number,
  questionIds: number[],
): Promise<{ sessionId: number; created: boolean }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query<{ id: number }>(
      `INSERT INTO sessions (student_id, subject_id) VALUES ($1, $2)
       ON CONFLICT (student_id, subject_id) DO NOTHING RETURNING id`,
      [studentId, subjectId],
    );
    if (!inserted.rows[0]) {
      const existing = await client.query<{ id: number }>(
        "SELECT id FROM sessions WHERE student_id = $1 AND subject_id = $2",
        [studentId, subjectId],
      );
      await client.query("COMMIT");
      return { sessionId: existing.rows[0].id, created: false };
    }

    const sessionId = inserted.rows[0].id;
    for (const [index, questionId] of questionIds.entries()) {
      await client.query(
        "INSERT INTO session_questions (session_id, question_id, position) VALUES ($1, $2, $3)",
        [sessionId, questionId, index + 1],
      );
    }
    await client.query("COMMIT");
    return { sessionId, created: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

