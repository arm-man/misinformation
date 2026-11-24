import { cookies } from "next/headers";
import { apiError, readJson, unexpectedPublicError } from "@/server/public-log";
import { startOrResumeSession } from "@/server/sessions";
import { STUDENT_COOKIE_NAME, studentCookieOptions } from "@/server/students";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !("subjectId" in body) || typeof body.subjectId !== "number" ||
      !Number.isSafeInteger(body.subjectId) || body.subjectId < 1) {
    return apiError(404, "SUBJECT_NOT_FOUND", "This subject is not available.");
  }

  try {
    const cookieStore = await cookies();
    const result = await startOrResumeSession(body.subjectId, cookieStore.get(STUDENT_COOKIE_NAME)?.value);
    if (result.status === "subject-not-found") {
      return apiError(404, "SUBJECT_NOT_FOUND", "This subject is not available.");
    }
    if (result.newKey) cookieStore.set(studentCookieOptions(result.newKey));
    return Response.json({ sessionId: result.sessionId }, { status: result.created ? 201 : 200 });
  } catch (error) {
    return unexpectedPublicError("Starting a Session failed", error);
  }
}
