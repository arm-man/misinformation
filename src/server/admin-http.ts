import "server-only";

import { hasAdminAccess } from "./admin-auth";
import { pool } from "./db";

export function apiError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

export async function requireAdmin(): Promise<Response | null> {
  if (await hasAdminAccess()) return null;
  return apiError(401, "ADMIN_AUTH_REQUIRED", "Sign in to Administration.");
}

export function positiveId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function unexpectedAdminError(context: string, error: unknown): Promise<Response> {
  // Keep SQL values, cookies, and credentials out of operational logs.
  const kind = error instanceof Error ? error.name : "UnknownError";
  const message = `${context}: ${kind}`;
  try {
    await pool.query("INSERT INTO logs (message) VALUES ($1)", [message]);
  } catch {
    console.error("Could not write an Administration error to the logs table.");
    return apiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
  }
  if (process.env.RESEND_API_KEY && process.env.LOG_EMAIL_TO) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Cherry Tree <logs@misinformation.wadecherry.us>",
          to: process.env.LOG_EMAIL_TO,
          subject: "New log added to Misinformation",
          text: message,
        }),
      });
      if (!response.ok) console.error("Could not email an Administration log entry.");
    } catch {
      console.error("Could not email an Administration log entry.");
    }
  }
  return apiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
}
