import { cookies } from "next/headers";
import { apiError, positiveId, unexpectedPublicError, writePublicLog } from "@/server/public-log";
import { completeSession } from "@/server/session-mutations";
import { findStudent, STUDENT_COOKIE_NAME } from "@/server/students";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ sessionId: string }> }): Promise<Response> {
  const sessionId = positiveId((await params).sessionId);
  if (sessionId === null) return apiError(400, "INVALID_SESSION_ID", "Invalid session.");
  try {
    const student = await findStudent((await cookies()).get(STUDENT_COOKIE_NAME)?.value);
    if (!student) return apiError(401, "STUDENT_REQUIRED", "Start an examination first.");
    const result = await completeSession(student.id, sessionId);
    if (result.error === "SESSION_NOT_FOUND") return apiError(404, result.error, "Session not found.");
    if (result.error === "SESSION_FORBIDDEN") return apiError(403, result.error, "This session belongs to another student.");
    if (result.error === "SESSION_INCOMPLETE") return apiError(409, result.error, "Answer or skip every question before finishing.");
    if (result.completedNow) await writePublicLog(`Student ${student.id} completed Session ${sessionId}.`);
    return new Response(null, { status: 200 });
  } catch (error) {
    return unexpectedPublicError("Completing a Session failed", error);
  }
}
