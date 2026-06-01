import z from "zod";

export const AltmountSettings = z.object({
  altmountUrl: z
    .url()
    .describe("altmount base URL (e.g. http://10.0.0.66:8081)"),
  altmountApiKey: z
    .string()
    .min(1)
    .describe("altmount SABnzbd-compatible API key"),
  pollIntervalMs: z.coerce
    .number()
    .int()
    .positive()
    .default(10_000)
    .describe(
      "How often (ms) to poll the altmount queue while waiting for a download to finish",
    ),
  pollTimeoutMs: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 60 * 1000)
    .describe(
      "Maximum total time (ms) to wait before giving up on a download (default: 30 min)",
    ),
  webdavUrl: z
    .url()
    .default("http://altmount:8081/webdav")
    .describe(
      "altmount WebDAV base URL. riven's VFS streams completed downloads from here (e.g. http://altmount:8081/webdav)",
    ),
  webdavUser: z
    .string()
    .default("usenet")
    .describe("Username for WebDAV basic auth"),
  webdavPass: z
    .string()
    .default("usenet")
    .describe("Password for WebDAV basic auth"),
  webdavRootPath: z
    .string()
    .default("/mnt/altmount")
    .describe(
      "On-disk root that the WebDAV root serves. The SAB history `storage` path is rebased from this prefix onto `webdavUrl` (default: /mnt/altmount)",
    ),
});

export type AltmountSettings = z.infer<typeof AltmountSettings>;
