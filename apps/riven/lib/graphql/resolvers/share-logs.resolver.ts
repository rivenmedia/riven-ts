import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { Mutation, Resolver } from "type-graphql";

import {
  type SessionID,
  getSessionId,
} from "../../utilities/logger/session-id.ts";

import type { TransformableInfo } from "logform";

const ELASTICSEARCH_URL = "https://elastic.dev.riven.tv";
const ELASTICSEARCH_AUTH = `Basic ${Buffer.from("riven_log_uploader:riven-shared-logs-upload-only").toString("base64")}`;
const INDEX_NAME = "riven-shared-logs";

@Resolver()
export class ShareLogsResolver {
  @Mutation(() => String, {
    description:
      "Uploads the last 24 hours of ECS logs to Elasticsearch and returns the session ID for lookup.",
  })
  async shareLogs(): Promise<SessionID> {
    const { settings } = await import("../../utilities/settings.ts");

    if (!settings.loggingEnabled) {
      throw new Error("Logging is disabled; cannot share logs.");
    }

    const { ecsSymlinkPath } = await import("../../utilities/logger/logger.ts");

    const logFileLines = this.#readLogFileLines(ecsSymlinkPath);
    const action = JSON.stringify({ index: { _index: INDEX_NAME } });

    await this.#bulkIndex(action, logFileLines);

    return getSessionId();
  }

  async *#readLogFileLines(
    filePath: string,
  ): AsyncGenerator<TransformableInfo> {
    const rl = createInterface({
      input: createReadStream(filePath, { encoding: "utf-8" }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) {
        continue;
      }

      try {
        yield JSON.parse(line);
      } catch {
        // Skip malformed lines
      }
    }
  }

  async #bulkIndex(
    action: string,
    logs: AsyncGenerator<TransformableInfo>,
  ): Promise<void> {
    let body = "";

    for await (const log of logs) {
      body += `${action}\n${JSON.stringify(log)}\n`;
    }

    if (!body.length) {
      throw new Error("No log entries found within the last 24 hours.");
    }

    const response = await fetch(`${ELASTICSEARCH_URL}/_bulk`, {
      method: "POST",
      headers: {
        "content-type": "application/x-ndjson",
        authorization: ELASTICSEARCH_AUTH,
      },
      body,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `Elasticsearch bulk index failed (${response.status.toString()}): ${text}`,
      );
    }
  }
}
