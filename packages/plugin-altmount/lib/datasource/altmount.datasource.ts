import { BaseDataSource, type RateLimiterOptions } from "@repo/util-plugin-sdk";

import { SabAddurlResponse } from "../schemas/sab-addurl-response.schema.ts";
import { SabHistoryResponse } from "../schemas/sab-history-response.schema.ts";
import { SabQueueResponse } from "../schemas/sab-queue-response.schema.ts";
import { parsePropfindEntries, selectCompletedMediaFile } from "./propfind.ts";

import type { AltmountSettings } from "../altmount-settings.schema.ts";

/** Terminal result of a completed altmount download (from the SAB history slot). */
export interface CompletedDownload {
  status: "completed";
  /** On-disk directory the files were written to (e.g. /mnt/altmount/complete/Default). */
  storage: string | undefined;
  /** Release name (defaults to the nzo_id when the slot omits it). */
  name: string;
  /** Total downloaded size in bytes, when reported. */
  bytes: number | undefined;
}

/** A completed media file resolved to a streamable, authed WebDAV URL. */
export interface ResolvedCompletedFile {
  /** WebDAV URL with credentials as userinfo; riven's VFS converts these to a header. */
  streamUrl: string;
  fileSize: number;
  originalFilename: string;
}

/**
 * Inspect a history slot's status and decide what it means for our poll loop.
 *
 * Extracted as a pure function so it can be unit-tested without instantiating
 * the full datasource (avoids shadow-testing).
 */
export type HistoryDecision =
  | { kind: "completed" }
  | { kind: "failed"; message: string }
  | { kind: "still-running" };

export function classifyHistoryStatus(
  status: string,
  failMessage: string | undefined,
): HistoryDecision {
  if (status === "Completed") return { kind: "completed" };
  if (status === "Failed") {
    return { kind: "failed", message: failMessage ?? "no reason given" };
  }
  return { kind: "still-running" };
}

export class AltmountAPI extends BaseDataSource<AltmountSettings> {
  override baseURL = this.settings.altmountUrl;
  override serviceName = "Altmount";

  protected override rateLimiterOptions: RateLimiterOptions = {
    max: 600,
    duration: 60 * 1000,
  };

  override async validate(): Promise<boolean> {
    try {
      await this.get(
        `api?mode=version&apikey=${encodeURIComponent(this.settings.altmountApiKey)}&output=json`,
      );
      return true;
    } catch {
      return false;
    }
  }

  async addurl(params: {
    nzbUrl: string;
    expectedTitle: string;
  }): Promise<string> {
    // SABnzbd-standard `mode=addurl` takes the NZB URL in `name`, with the
    // human-readable title in `nzbname`. AltMount follows this; passing the
    // URL via a separate `url` param made AltMount treat the title as the URL
    // and fast-fail with "Failed to download NZB from URL".
    const path = `api?mode=addurl&apikey=${encodeURIComponent(
      this.settings.altmountApiKey,
    )}&name=${encodeURIComponent(params.nzbUrl)}&nzbname=${encodeURIComponent(
      params.expectedTitle,
    )}&output=json`;

    const raw = await this.get<unknown>(path);
    const parsed = SabAddurlResponse.parse(raw);

    if (parsed.status === false) {
      throw new Error(`altmount addurl failed: ${parsed.error}`);
    }
    if (parsed.nzo_ids.length === 0) {
      throw new Error(
        "altmount addurl returned status=true but no nzo_ids — refusing to proceed",
      );
    }
    return parsed.nzo_ids[0]!;
  }

  /**
   * Poll altmount until the given nzo_id reaches a terminal state.
   *
   * On success returns the completed history slot's `storage` directory,
   * release `name` and `bytes` — the caller resolves the actual media file
   * via {@link resolveCompletedFile}. Throws on failure (with the SAB
   * fail_message if available), on poll timeout, or on the nzo_id
   * disappearing from both queue and history.
   */
  async waitForCompletion(nzoId: string): Promise<CompletedDownload> {
    const deadline = Date.now() + this.settings.pollTimeoutMs;

    while (Date.now() < deadline) {
      const queueRaw = await this.get<unknown>(
        `api?mode=queue&nzo_ids=${encodeURIComponent(nzoId)}&apikey=${encodeURIComponent(
          this.settings.altmountApiKey,
        )}&output=json`,
      );
      const queue = SabQueueResponse.parse(queueRaw).queue;
      const inQueue = queue.slots.find((s) => s.nzo_id === nzoId);

      if (!inQueue) {
        // Item left the queue — must be in history with a terminal status
        const histRaw = await this.get<unknown>(
          `api?mode=history&nzo_ids=${encodeURIComponent(nzoId)}&apikey=${encodeURIComponent(
            this.settings.altmountApiKey,
          )}&output=json`,
        );
        const hist = SabHistoryResponse.parse(histRaw).history;
        const histSlot = hist.slots.find((s) => s.nzo_id === nzoId);

        if (!histSlot) {
          throw new Error(
            `altmount: nzo_id ${nzoId} not in queue or history (likely a transient race; retry)`,
          );
        }

        const decision = classifyHistoryStatus(
          histSlot.status,
          histSlot.fail_message,
        );

        if (decision.kind === "completed") {
          return {
            status: "completed",
            storage: histSlot.storage,
            name: histSlot.name ?? nzoId,
            bytes: histSlot.bytes,
          };
        }
        if (decision.kind === "failed") {
          throw new Error(
            `altmount download failed (${nzoId}): ${decision.message}`,
          );
        }
        // still-running but no queue presence — fall through to continue polling
      }

      await new Promise((r) => setTimeout(r, this.settings.pollIntervalMs));
    }

    throw new Error(
      `altmount poll timeout after ${this.settings.pollTimeoutMs.toString()}ms for nzo_id ${nzoId}`,
    );
  }

  /**
   * Resolve a completed download's media file to a streamable WebDAV URL.
   *
   * The SAB `storage` field is only the completed directory, so we rebase it
   * from `webdavRootPath` onto `webdavUrl`, list that directory over WebDAV
   * (PROPFIND Depth:1), pick the media file for the release, and build a URL
   * with the WebDAV credentials embedded as userinfo. riven's VFS strips the
   * userinfo into an `Authorization` header (undici ignores raw URL userinfo).
   */
  async resolveCompletedFile(
    completed: Pick<CompletedDownload, "storage" | "name">,
  ): Promise<ResolvedCompletedFile> {
    const { storage, name } = completed;

    if (!storage) {
      throw new Error(
        `altmount: completed download "${name}" has no storage path — cannot resolve media file`,
      );
    }

    const { webdavUrl, webdavRootPath, webdavUser, webdavPass } = this.settings;

    // Rebase the on-disk storage dir onto the WebDAV base, e.g.
    // "/mnt/altmount/complete/Default" -> "<webdavUrl>/complete/Default/".
    const relative = storage.startsWith(webdavRootPath)
      ? storage.slice(webdavRootPath.length)
      : storage;
    const base = webdavUrl.replace(/\/+$/, "");
    const dirUrl = `${base}/${relative.replace(/^\/+/, "").replace(/\/+$/, "")}/`;

    const authorization = `Basic ${Buffer.from(`${webdavUser}:${webdavPass}`).toString("base64")}`;

    const response = await fetch(dirUrl, {
      method: "PROPFIND",
      headers: { Depth: "1", Authorization: authorization },
    });

    if (!response.ok) {
      throw new Error(
        `altmount WebDAV PROPFIND failed (${response.status.toString()}) for ${dirUrl}`,
      );
    }

    const xml = await response.text();
    const chosen = selectCompletedMediaFile(parsePropfindEntries(xml), name);

    if (!chosen) {
      throw new Error(
        `altmount: no media file found in ${dirUrl} for release "${name}"`,
      );
    }

    // chosen.href is an absolute server path (e.g. /webdav/complete/Default/X.mkv).
    const streamUrl = new URL(chosen.href, base);
    streamUrl.username = webdavUser;
    streamUrl.password = webdavPass;

    const originalFilename = decodeURIComponent(
      chosen.href.slice(chosen.href.lastIndexOf("/") + 1),
    );

    return {
      streamUrl: streamUrl.href,
      fileSize: chosen.fileSize,
      originalFilename,
    };
  }

  /**
   * Cancel an in-flight altmount download (e.g. on Seerr request deletion).
   *
   * Named `deleteJob` rather than `delete` to avoid conflict with the
   * inherited `RESTDataSource.delete<TResult>()` HTTP helper.
   */
  async deleteJob(nzoId: string): Promise<void> {
    const path = `api?mode=queue&name=delete&value=${encodeURIComponent(
      nzoId,
    )}&apikey=${encodeURIComponent(this.settings.altmountApiKey)}&output=json`;
    await this.get<unknown>(path);
  }
}
