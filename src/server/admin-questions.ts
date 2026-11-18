import "server-only";

import type { QuestionInput } from "@/lib/admin-types";

const FIELDS = [
  "short_title", "question_text", "choice1", "choice2", "choice3", "choice4",
  "answer", "explanation", "why_it_spreads", "sources", "is_active",
];
const REQUIRED_TEXT = [
  "short_title", "question_text", "choice1", "choice2", "explanation", "why_it_spreads", "sources",
] as const;

export function validateQuestionInput(value: unknown): { input?: QuestionInput; error?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Enter the Question fields before saving." };
  }
  const fields = Object.keys(value);
  if (fields.some((field) => !FIELDS.includes(field))) {
    return { error: "The Question contains an unexpected field." };
  }
  const data = value as Record<string, unknown>;
  for (const field of REQUIRED_TEXT) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      return { error: `Enter ${field.replaceAll("_", " ")}.` };
    }
  }
  for (const field of ["choice3", "choice4"]) {
    if (data[field] !== undefined && data[field] !== null && typeof data[field] !== "string") {
      return { error: `${field} must be text.` };
    }
  }
  if (typeof data.is_active !== "boolean") return { error: "Choose whether the Question is active." };
  if (!Number.isInteger(data.answer) || ![1, 2, 3, 4].includes(data.answer as number)) {
    return { error: "Select a valid Answer." };
  }

  const choice3 = typeof data.choice3 === "string" && data.choice3.trim() ? data.choice3 : null;
  const choice4 = typeof data.choice4 === "string" && data.choice4.trim() ? data.choice4 : null;
  if (choice4 && !choice3) return { error: "Enter Choice 3 before Choice 4." };
  if (data.answer === 3 && !choice3) return { error: "Answer 3 needs Choice 3." };
  if (data.answer === 4 && !choice4) return { error: "Answer 4 needs Choice 4." };

  return {
    input: {
      short_title: data.short_title as string,
      question_text: data.question_text as string,
      choice1: data.choice1 as string,
      choice2: data.choice2 as string,
      choice3, choice4, answer: data.answer as number,
      explanation: data.explanation as string,
      why_it_spreads: data.why_it_spreads as string,
      sources: data.sources as string,
      is_active: data.is_active,
    },
  };
}
