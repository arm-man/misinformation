import { cookies } from "next/headers";
import { saveGeneralFeedback } from "@/server/feedback-data";
import { apiError, readJson, sendNotification, unexpectedPublicError, writePublicLog } from "@/server/public-log";
import { createStudent, findStudent, STUDENT_COOKIE_NAME, studentCookieOptions } from "@/server/students";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !("message" in body) || typeof body.message !== "string" || body.message.trim().length < 5) {
    return apiError(400, "INVALID_FEEDBACK", "Enter at least five characters of feedback.");
  }
  try {
    const message = body.message.trim();
    const cookieStore = await cookies();
    const existing = await findStudent(cookieStore.get(STUDENT_COOKIE_NAME)?.value);
    const student = existing ?? await createStudent();
    await saveGeneralFeedback(student.id, message);
    if (!existing) cookieStore.set(studentCookieOptions(student.key));
    await writePublicLog(`Student ${student.id} submitted general feedback.`);
    await sendNotification(`General feedback from Student ${student.id}:\n\n${message}`, "New general feedback added to Misinformation");
    return new Response(null, { status: 200 });
  } catch (error) {
    return unexpectedPublicError("Submitting general feedback failed", error);
  }
}
