import "server-only";

import { randomBytes } from "node:crypto";
import { pool } from "./db";

export const STUDENT_COOKIE_NAME = "misinformation_student";
const STUDENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export type Student = { id: number; key: string; email: string | null };

export function studentCookieOptions(key: string) {
  return {
    name: STUDENT_COOKIE_NAME,
    value: key,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STUDENT_COOKIE_MAX_AGE,
  };
}

export async function findStudent(key: string | undefined): Promise<Student | null> {
  if (!key || !/^[0-9a-f]{16}$/.test(key)) return null;
  const result = await pool.query<Student>(
    "SELECT id, key, email FROM students WHERE key = $1",
    [key],
  );
  return result.rows[0] ?? null;
}

export async function createStudent(email: string | null = null): Promise<Student> {
  // A Key collision is exceptionally unlikely, but the unique constraint is authoritative.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const key = randomBytes(8).toString("hex");
    try {
      const result = await pool.query<Student>(
        "INSERT INTO students (key, email) VALUES ($1, $2) RETURNING id, key, email",
        [key, email],
      );
      return result.rows[0];
    } catch (error) {
      if (!isKeyCollision(error)) throw error;
    }
  }
  throw new Error("Could not generate a unique Student Key.");
}

function isKeyCollision(error: unknown): boolean {
  return error !== null && typeof error === "object" &&
    "code" in error && error.code === "23505" &&
    "constraint" in error && error.constraint === "students_key_key";
}

export async function saveStudentEmail(studentId: number, email: string): Promise<void> {
  await pool.query("UPDATE students SET email = $1 WHERE id = $2", [email, studentId]);
}
