export const MAX_EMAIL_LENGTH = 60;

export function isValidEmail(value: string): boolean {
  return value.length <= MAX_EMAIL_LENGTH &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
