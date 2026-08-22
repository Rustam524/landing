import { randomBytes } from "crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

/** Generates a random temporary password for newly created employee accounts. */
export function generateTempPassword(length = 12) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}
