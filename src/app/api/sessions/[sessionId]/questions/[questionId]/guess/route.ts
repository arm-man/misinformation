import { cookies } from "next/headers";
import { apiError, positiveId, readJson, unexpectedPublicError } from "@/server/public-log";
import { saveGuess } from "@/server/session-mutations";
import { findStudent, STUDENT_COOKIE_NAME } from "@/server/students";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: {
  params: Promise<{ sessionId: string; questionId: string }>;
}): Promise<Response> {
  const { sessionId: rawSessionId, questionId: rawQuestionId } = await params;
  const sessionId = positiveId(rawSessionId);
  if (sessionId === null) return apiError(400, "INVALID_SESSION_ID", "Invalid session.");
  const questionId = positiveId(rawQuestionId);
  if (questionId === null) return apiError(400, "INVALID_QUESTION_ID", "Invalid question.");
  const body = await readJson(request);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !("choice" in body) || typeof body.choice !== "number" ||
      !Number.isInteger(body.choice) || body.choice < 0 || body.choice > 4) {
    return apiError(400, "INVALID_CHOICE", "Choose a valid answer.");
  }
  try {
    const student = await findStudent((await cookies()).get(STUDENT_COOKIE_NAME)?.value);
    if (!student) return apiError(401, "STUDENT_REQUIRED", "Start an examination first.");
    const error = await saveGuess(student.id, sessionId, questionId, body.choice);
    if (error === "SESSION_NOT_FOUND") return apiError(404, error, "Session not found.");
    if (error === "SESSION_FORBIDDEN") return apiError(403, error, "This session belongs to another student.");
    if (error === "QUESTION_NOT_FOUND") return apiError(404, error, "Question not found in this session.");
    if (error === "CHOICE_OUT_OF_BOUNDS") return apiError(404, error, "That choice is not available.");
    if (error === "SESSION_ALREADY_COMPLETED") return apiError(409, error, "This examination is already complete.");
    return new Response(null, { status: 200 });
  } catch (error) {
    return unexpectedPublicError("Saving a Guess failed", error);
  }
}
