import { cookies } from "next/headers";
import { adminCookieOptions } from "@/server/admin-auth";
import { requireAdmin, unexpectedAdminError } from "@/server/admin-http";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
    (await cookies()).set({ ...adminCookieOptions(0), value: "" });
    return new Response(null, { status: 200 });
  } catch (error) {
    return unexpectedAdminError("Administration sign out failed", error);
  }
}
