import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "misinformation_admin";
const SESSION_SECONDS = 8 * 60 * 60;

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is required.");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function verifyAdminPassword(password: string): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) throw new Error("ADMIN_PASSWORD is required.");

  // Compare fixed-length digests so a wrong-length password follows the same path.
  const suppliedDigest = createHmac("sha256", "admin-password-check").update(password).digest();
  const configuredDigest = createHmac("sha256", "admin-password-check").update(configured).digest();
  return timingSafeEqual(suppliedDigest, configuredDigest);
}

export function createAdminSession(): { value: string; maxAge: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `1.${expiresAt}.${randomBytes(16).toString("base64url")}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_SECONDS };
}

export function isValidAdminSession(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== "1" || !/^\d+$/.test(parts[1])) return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  const payload = parts.slice(0, 3).join(".");
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(parts[3]);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function hasAdminAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get(COOKIE_NAME)?.value);
}

export function adminCookieOptions(maxAge: number) {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
