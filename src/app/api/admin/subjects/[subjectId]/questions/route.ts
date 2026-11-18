import { createAdminQuestion, getAdminQuestions, subjectExists } from "@/server/admin-data";
import { apiError, positiveId, readJson, requireAdmin, unexpectedAdminError } from "@/server/admin-http";
import { validateQuestionInput } from "@/server/admin-questions";

export const runtime = "nodejs";

type Context = { params: Promise<{ subjectId: string }> };

export async function GET(_request: Request, context: Context): Promise<Response> {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const subjectId = positiveId((await context.params).subjectId);
    if (subjectId === null || !(await subjectExists(subjectId))) {
      return apiError(404, "SUBJECT_NOT_FOUND", "Subject not found.");
    }
    return Response.json(await getAdminQuestions(subjectId));
  } catch (error) {
    return unexpectedAdminError("Loading Administration Questions failed", error);
  }
}

export async function POST(request: Request, context: Context): Promise<Response> {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const subjectId = positiveId((await context.params).subjectId);
    if (subjectId === null || !(await subjectExists(subjectId))) {
      return apiError(404, "SUBJECT_NOT_FOUND", "Subject not found.");
    }
    const validation = validateQuestionInput(await readJson(request));
    if (!validation.input) return apiError(400, "INVALID_QUESTION", validation.error ?? "Invalid Question.");
    const question = await createAdminQuestion(subjectId, validation.input);
    if (!question) return apiError(404, "SUBJECT_NOT_FOUND", "Subject not found.");
    return Response.json(question, { status: 201 });
  } catch (error) {
    return unexpectedAdminError("Creating an Administration Question failed", error);
  }
}
