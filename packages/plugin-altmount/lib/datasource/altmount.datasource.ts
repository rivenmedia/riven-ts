import { BaseDataSource, type RateLimiterOptions } from "@repo/util-plugin-sdk";

import { SabAddurlResponse } from "../schemas/sab-addurl-response.schema.ts";
import { SabHistoryResponse } from "../schemas/sab-history-response.schema.ts";
import { SabQueueResponse } from "../schemas/sab-queue-response.schema.ts";

import type { AltmountSettings } from "../altmount-settings.schema.ts";

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
   * Returns "completed" on success. Throws on failure (with the SAB
   * fail_message if available), on poll timeout, or on the nzo_id
   * disappearing from both queue and history.
   */
  async waitForCompletion(nzoId: string): Promise<"completed"> {
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

        if (decision.kind === "completed") return "completed";
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
