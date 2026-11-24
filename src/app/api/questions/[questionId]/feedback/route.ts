import { cookies } from "next/headers";
import { canGiveQuestionFeedback, saveQuestionFeedback } from "@/server/feedback-data";
import { apiError, positiveId, readJson, sendNotification, unexpectedPublicError, writePublicLog } from "@/server/public-log";
import { findStudent, STUDENT_COOKIE_NAME } from "@/server/students";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ questionId: string }> }): Promise<Response> {
  const questionId = positiveId((await params).questionId);
  if (questionId === null) return apiError(400, "INVALID_QUESTION_ID", "Invalid question.");
  const body = await readJson(request);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !("message" in body) || typeof body.message !== "string" || body.message.trim().length < 5) {
    return apiError(400, "INVALID_FEEDBACK", "Enter at least five characters of feedback.");
  }
  try {
    const student = await findStudent((await cookies()).get(STUDENT_COOKIE_NAME)?.value);
    if (!student) return apiError(401, "STUDENT_REQUIRED", "Complete an examination first.");
    if (!await canGiveQuestionFeedback(student.id, questionId)) {
      return apiError(404, "QUESTION_NOT_FOUND", "Question not found in your completed examinations.");
    }
    const message = body.message.trim();
    await saveQuestionFeedback(student.id, questionId, message);
    await writePublicLog(`Student ${student.id} submitted feedback for Question ${questionId}.`);
    await sendNotification(`Question ${questionId} feedback from Student ${student.id}:\n\n${message}`, "New question feedback added to Misinformation");
    return new Response(null, { status: 200 });
  } catch (error) {
    return unexpectedPublicError("Submitting Question feedback failed", error);
  }
}
