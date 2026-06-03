/**
 * Returns true if a release name matches any entry in Real-Debrid's legal-filter
 * blocklist. RD rejects certain release-name patterns with HTTP 451, so a match
 * means the release should be skipped on RD (and tried on other stores instead).
 *
 * Matching is a plain case-insensitive substring test. This covers both of RD's
 * known rules: bare substrings (e.g. `web-dl`, `webrip`) and source+codec pairs
 * that must be dot-separated and adjacent (e.g. `web.x264`) — the literal `.` in
 * the pattern enforces the adjacency, so `webx264` does not match `web.x264`.
 */
export function matchesRealdebridFilter(
  rawTitle: string,
  blocklist: readonly string[],
): boolean {
  const lower = rawTitle.toLowerCase();

  return blocklist.some((pattern) => lower.includes(pattern.toLowerCase()));
}
