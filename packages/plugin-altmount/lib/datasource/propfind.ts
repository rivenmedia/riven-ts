/**
 * Minimal WebDAV PROPFIND helpers.
 *
 * AltMount writes each completed download into a shared category directory
 * (e.g. `/webdav/complete/Default/`) and the SAB `mode=history` response only
 * reports that *directory* in its `storage` field — not the actual media file.
 * To build a streamable URL we list the directory over WebDAV and pick the
 * media file belonging to the release.
 *
 * Parsing is done with regexes rather than an XML library to avoid pulling a
 * dependency into the plugin for a handful of well-known DAV tags. The
 * functions are pure so they can be unit-tested without a server.
 */

export interface PropfindEntry {
  /** The DAV href, e.g. "/webdav/complete/Default/Movie.mkv" (may be %-encoded). */
  href: string;
  /** True when the entry is a directory (`<resourcetype><collection/>`). */
  isCollection: boolean;
  /** `<getcontentlength>` as a number, or null when absent. */
  contentLength: number | null;
  /** `<getcontenttype>`, or null when absent. */
  contentType: string | null;
  /** `<displayname>`, or null when absent. */
  displayName: string | null;
}

const VIDEO_EXTENSIONS = new Set([
  ".mkv",
  ".mp4",
  ".m4v",
  ".avi",
  ".mov",
  ".wmv",
  ".ts",
  ".m2ts",
  ".mpg",
  ".mpeg",
  ".webm",
]);

// Match a tag allowing any (or no) namespace prefix: <D:href>, <href>, <d:href>.
function tag(name: string): RegExp {
  return new RegExp(
    `<(?:[\\w-]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`,
    "i",
  );
}

const RESPONSE_RE =
  /<(?:[\w-]+:)?response\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?response>/gi;
const HREF_RE = tag("href");
const RESOURCETYPE_RE = tag("resourcetype");
const COLLECTION_RE = /<(?:[\w-]+:)?collection\b/i;
const CONTENTLENGTH_RE = tag("getcontentlength");
const CONTENTTYPE_RE = tag("getcontenttype");
const DISPLAYNAME_RE = tag("displayname");

function extract(block: string, re: RegExp): string | null {
  const match = re.exec(block);
  return match ? match[1]!.trim() : null;
}

export function parsePropfindEntries(xml: string): PropfindEntry[] {
  const entries: PropfindEntry[] = [];

  for (const match of xml.matchAll(RESPONSE_RE)) {
    const block = match[1]!;
    const href = extract(block, HREF_RE);

    if (href === null) {
      continue;
    }

    const resourcetype = extract(block, RESOURCETYPE_RE) ?? "";
    const contentLengthRaw = extract(block, CONTENTLENGTH_RE);
    const contentLength =
      contentLengthRaw !== null && contentLengthRaw !== ""
        ? Number(contentLengthRaw)
        : null;

    entries.push({
      href,
      isCollection: COLLECTION_RE.test(resourcetype),
      contentLength: Number.isFinite(contentLength) ? contentLength : null,
      contentType: extract(block, CONTENTTYPE_RE),
      displayName: extract(block, DISPLAYNAME_RE),
    });
  }

  return entries;
}

function basename(href: string): string {
  const trimmed = href.replace(/\/+$/, "");
  const last = trimmed.slice(trimmed.lastIndexOf("/") + 1);
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

function isVideoFile(entry: PropfindEntry, name: string): boolean {
  if (entry.contentType?.toLowerCase().startsWith("video/")) {
    return true;
  }
  return VIDEO_EXTENSIONS.has(extensionOf(name));
}

/**
 * Return every video file in a directory listing (skipping collections and
 * non-video files). Used for season packs, which land in their own subdir so
 * every video file belongs to the pack.
 */
export function selectAllMediaFiles(
  entries: PropfindEntry[],
): { href: string; fileSize: number }[] {
  return entries
    .filter((entry) => !entry.isCollection)
    .filter((entry) =>
      isVideoFile(entry, entry.displayName ?? basename(entry.href)),
    )
    .map((entry) => ({ href: entry.href, fileSize: entry.contentLength ?? 0 }));
}

/**
 * Pick the media file for `releaseName` from a directory listing.
 *
 * A file matches when its name (sans extension) equals the release name, or
 * its name starts with it (covers AltMount's `_1` de-dup suffix). Only video
 * files are considered; on multiple matches the largest wins.
 */
export function selectCompletedMediaFile(
  entries: PropfindEntry[],
  releaseName: string,
): { href: string; fileSize: number } | null {
  const target = releaseName.toLowerCase();

  const candidates = entries
    .filter((entry) => !entry.isCollection)
    .map((entry) => ({
      entry,
      name: entry.displayName ?? basename(entry.href),
    }))
    .filter(({ entry, name }) => {
      const lower = name.toLowerCase();
      const stem = lower.slice(0, lower.length - extensionOf(lower).length);
      const matchesName = stem === target || lower.startsWith(target);
      return matchesName && isVideoFile(entry, name);
    });

  if (candidates.length === 0) {
    return null;
  }

  const best = candidates.reduce((largest, current) =>
    (current.entry.contentLength ?? 0) > (largest.entry.contentLength ?? 0)
      ? current
      : largest,
  );

  return { href: best.entry.href, fileSize: best.entry.contentLength ?? 0 };
}
