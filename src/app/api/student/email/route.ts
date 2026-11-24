import { cookies } from "next/headers";
import { isValidEmail } from "@/lib/email";
import { apiError, readJson, unexpectedPublicError, writePublicLog } from "@/server/public-log";
import { createStudent, findStudent, saveStudentEmail, STUDENT_COOKIE_NAME, studentCookieOptions } from "@/server/students";

export const runtime = "nodejs";

export async function PUT(request: Request): Promise<Response> {
  const body = await readJson(request);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !("email" in body) || typeof body.email !== "string" ||
      !isValidEmail(body.email.trim())) {
    return apiError(400, "INVALID_EMAIL", "Enter a valid email address of 60 characters or fewer.");
  }

  try {
    const email = body.email.trim();
    const cookieStore = await cookies();
    const student = await findStudent(cookieStore.get(STUDENT_COOKIE_NAME)?.value);
    if (student) {
      await saveStudentEmail(student.id, email);
      await writePublicLog(`Student ${student.id} saved an email address.`);
    } else {
      const created = await createStudent(email);
      cookieStore.set(studentCookieOptions(created.key));
      await writePublicLog(`Student ${created.id} saved an email address.`);
    }
    return new Response(null, { status: 200 });
  } catch (error) {
    return unexpectedPublicError("Saving a Student email failed", error);
  }
}
