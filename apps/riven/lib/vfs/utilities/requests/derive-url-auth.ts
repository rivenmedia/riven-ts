/**
 * Derive HTTP Basic auth from a URL's userinfo.
 *
 * undici (the VFS HTTP client) ignores credentials embedded in a URL's
 * userinfo — it will not send an `Authorization` header for
 * `http://user:pass@host/...`. The altmount/NZB pipeline stores WebDAV stream
 * URLs with credentials as userinfo, so before streaming we convert that
 * userinfo into an explicit `Authorization: Basic` header and hand back the
 * URL with the userinfo stripped.
 *
 * URLs without userinfo (e.g. TorBox/debrid CDN links, which carry tokens in
 * the query string) are returned byte-for-byte unchanged with no headers, so
 * the torrent path is unaffected.
 */
export function deriveUrlAuth(rawUrl: string): {
  url: string;
  headers: Record<string, string>;
} {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { url: rawUrl, headers: {} };
  }

  if (!parsed.username && !parsed.password) {
    return { url: rawUrl, headers: {} };
  }

  const user = decodeURIComponent(parsed.username);
  const pass = decodeURIComponent(parsed.password);

  parsed.username = "";
  parsed.password = "";

  return {
    url: parsed.href,
    headers: {
      authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`,
    },
  };
}
