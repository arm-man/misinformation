import { cookies } from "next/headers";
import { adminCookieOptions, createAdminSession, verifyAdminPassword } from "@/server/admin-auth";
import { apiError, readJson, unexpectedAdminError } from "@/server/admin-http";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        !("password" in body) || typeof body.password !== "string") {
      return apiError(400, "INVALID_ADMIN_PASSWORD", "Enter the Administration password.");
    }
    if (!verifyAdminPassword(body.password)) {
      return apiError(401, "INVALID_ADMIN_PASSWORD", "Incorrect password.");
    }
    const session = createAdminSession();
    (await cookies()).set({ ...adminCookieOptions(session.maxAge), value: session.value });
    return new Response(null, { status: 200 });
  } catch (error) {
    return unexpectedAdminError("Administration sign in failed", error);
  }
}
