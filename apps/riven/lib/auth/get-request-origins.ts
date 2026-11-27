/**
 * A hostname or bracketed IPv6 address, with an optional port.
 * Anything else, such as a wildcard Better Auth would match other origins against, isn't trusted.
 */
const hostPattern = /^(?:[a-z0-9.-]+|\[[0-9a-f:.]+\])(?::\d{1,5})?$/iu;

/**
 * Returns the origins the browser addressed the request to.
 *
 * The frontend forwards the browser's auth requests to Riven, with the host the browser used in `x-forwarded-host`.
 * Trusting that host makes Better Auth's CSRF check a same-origin check, so the page Riven is served from is trusted
 * without `RIVEN_FRONTEND_SETTING__origin` being set to it. Browsers can't set `x-forwarded-host` on a cross-site
 * request without a CORS preflight, which Riven doesn't allow.
 *
 * Both schemes are trusted, as a reverse proxy that terminates TLS may not forward the scheme the browser used.
 */
export function getRequestOrigins(request: Request | undefined) {
  const host =
    request?.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request?.headers.get("host");

  if (!host || !hostPattern.test(host)) {
    return [];
  }

  return [`https://${host}`, `http://${host}`];
}
