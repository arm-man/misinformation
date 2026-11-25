import "server-only";

import type { Question, QuestionInput, QuestionTitle, Subject } from "@/lib/admin-types";
import { pool } from "./db";

const QUESTION_COLUMNS = `id, subject_id, short_title, question_text, choice1, choice2,
  choice3, choice4, answer, explanation, why_it_spreads, sources, is_active`;

function toQuestion(row: Question): Question {
  return {
    id: row.id,
    subject_id: row.subject_id,
    short_title: row.short_title,
    question_text: row.question_text,
    choice1: row.choice1,
    choice2: row.choice2,
    choice3: row.choice3,
    choice4: row.choice4,
    answer: row.answer,
    explanation: row.explanation,
    why_it_spreads: row.why_it_spreads,
    sources: row.sources,
    is_active: row.is_active,
  };
}

export async function getAdminSubjects(): Promise<Subject[]> {
  const result = await pool.query<Subject>("SELECT id, title FROM subjects ORDER BY title, id");
  return result.rows.map((row) => ({ id: row.id, title: row.title }));
}

export async function getAdminQuestionTitles(): Promise<QuestionTitle[]> {
  const result = await pool.query<QuestionTitle>(
    "SELECT id, subject_id, short_title FROM questions ORDER BY id ASC",
  );
  return result.rows.map((row) => ({
    id: row.id, subject_id: row.subject_id, short_title: row.short_title,
  }));
}

export async function subjectExists(subjectId: number): Promise<boolean> {
  const result = await pool.query("SELECT 1 FROM subjects WHERE id = $1", [subjectId]);
  return result.rowCount !== 0;
}

export async function getAdminQuestions(subjectId: number): Promise<Question[]> {
  const result = await pool.query<Question>(
    `SELECT ${QUESTION_COLUMNS} FROM questions WHERE subject_id = $1 ORDER BY id ASC`,
    [subjectId],
  );
  return result.rows.map(toQuestion);
}

function questionValues(input: QuestionInput): (string | number | boolean | null)[] {
  return [
    input.short_title, input.question_text, input.choice1, input.choice2,
    input.choice3, input.choice4, input.answer, input.explanation,
    input.why_it_spreads, input.sources, input.is_active,
  ];
}

export async function createAdminQuestion(subjectId: number, input: QuestionInput): Promise<Question | null> {
  const result = await pool.query<Question>(
    `INSERT INTO questions (subject_id, short_title, question_text, choice1, choice2,
      choice3, choice4, answer, explanation, why_it_spreads, sources, is_active)
     SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
     WHERE EXISTS (SELECT 1 FROM subjects WHERE id = $1)
     RETURNING ${QUESTION_COLUMNS}`,
    [subjectId, ...questionValues(input)],
  );
  return result.rows[0] ? toQuestion(result.rows[0]) : null;
}

export async function updateAdminQuestion(questionId: number, input: QuestionInput): Promise<Question | null> {
  const result = await pool.query<Question>(
    `UPDATE questions SET short_title = $2, question_text = $3, choice1 = $4,
      choice2 = $5, choice3 = $6, choice4 = $7, answer = $8,
      explanation = $9, why_it_spreads = $10, sources = $11, is_active = $12
     WHERE id = $1 RETURNING ${QUESTION_COLUMNS}`,
    [questionId, ...questionValues(input)],
  );
  return result.rows[0] ? toQuestion(result.rows[0]) : null;
}
