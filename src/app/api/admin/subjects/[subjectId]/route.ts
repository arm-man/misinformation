import { updateAdminSubjectActive } from "@/server/admin-data";
import { apiError, positiveId, readJson, requireAdmin, unexpectedAdminError } from "@/server/admin-http";

export const runtime = "nodejs";

type Context = { params: Promise<{ subjectId: string }> };

export async function PATCH(request: Request, context: Context): Promise<Response> {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    const subjectId = positiveId((await context.params).subjectId);
    if (subjectId === null) return apiError(404, "SUBJECT_NOT_FOUND", "Subject not found.");
    const data = await readJson(request);
    if (!data || typeof data !== "object" || Array.isArray(data) ||
        !("is_active" in data) || typeof data.is_active !== "boolean" ||
        Object.keys(data).some((field) => field !== "is_active")) {
      return apiError(400, "INVALID_SUBJECT", "Send only is_active with a boolean value.");
    }
    const updated = await updateAdminSubjectActive(subjectId, data.is_active);
    if (!updated) return apiError(404, "SUBJECT_NOT_FOUND", "Subject not found.");
    return new Response(null, { status: 204 });
  } catch (error) {
    return unexpectedAdminError("Updating an Administration Subject failed", error);
  }
}
