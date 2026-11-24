import "server-only";

import { pool } from "./db";

export async function writePublicLog(message: string, severity: "error" | "warning" | "info" = "info"): Promise<void> {
  try {
    await pool.query("INSERT INTO logs (severity, message) VALUES ($1, $2)", [severity, message]);
  } catch {
    console.error("Could not write a public event to the logs table.");
    return;
  }

  await sendNotification(message);
}

export async function sendNotification(message: string, subject = "New log added to Misinformation"): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.LOG_EMAIL_TO) return;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cherry Tree <logs@misinformation.wadecherry.us>",
        to: process.env.LOG_EMAIL_TO,
        subject,
        text: message,
      }),
    });
    if (!response.ok) console.error("Could not email a public log entry.");
  } catch {
    console.error("Could not email a public log entry.");
  }
}

export function positiveId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export async function unexpectedPublicError(context: string, error: unknown): Promise<Response> {
  const kind = error instanceof Error ? error.name : "UnknownError";
  await writePublicLog(`${context}: ${kind}`, "error");
  return apiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
}

export async function withPublicPageLogging<T>(context: string, load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    const kind = error instanceof Error ? error.name : "UnknownError";
    await writePublicLog(`${context}: ${kind}`, "error");
    throw error;
  }
}

export function apiError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}
