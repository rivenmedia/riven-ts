import type { TestCookie } from "better-auth/plugins";

export function serialiseCookie({
  name,
  path,
  value,
  sameSite,
  httpOnly,
  secure,
}: TestCookie) {
  const cookieParts = [`${name}=${value}`];

  if (path) {
    cookieParts.push(`Path=${path}`);
  }

  if (sameSite) {
    cookieParts.push(`SameSite=${sameSite}`);
  }

  if (secure) {
    cookieParts.push("Secure");
  }

  if (httpOnly) {
    cookieParts.push("HttpOnly");
  }

  return cookieParts.join("; ");
}
