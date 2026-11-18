import { updateAdminQuestion } from "@/server/admin-data";
import { apiError, positiveId, readJson, requireAdmin, unexpectedAdminError } from "@/server/admin-http";
import { validateQuestionInput } from "@/server/admin-questions";

export const runtime = "nodejs";

type Context = { params: Promise<{ questionId: string }> };

export async function PUT(request: Request, context: Context): Promise<Response> {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const questionId = positiveId((await context.params).questionId);
    if (questionId === null) return apiError(404, "QUESTION_NOT_FOUND", "Question not found.");
    const validation = validateQuestionInput(await readJson(request));
    if (!validation.input) return apiError(400, "INVALID_QUESTION", validation.error ?? "Invalid Question.");
    const question = await updateAdminQuestion(questionId, validation.input);
    if (!question) return apiError(404, "QUESTION_NOT_FOUND", "Question not found.");
    return Response.json(question);
  } catch (error) {
    return unexpectedAdminError("Updating an Administration Question failed", error);
  }
}
