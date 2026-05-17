import { createReadStream } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { getEnvironmentData } from "node:worker_threads";
import { Mutation, Resolver } from "type-graphql";
import { request } from "undici";

import { SessionID } from "../../utilities/logger/log-context.ts";
import { settings } from "../../utilities/settings.ts";

const ELASTICSEARCH_URL = "http://dev.riven.tv:9200";
const ELASTICSEARCH_AUTH = `Basic ${Buffer.from("riven_log_uploader:riven-shared-logs-upload-only").toString("base64")}`;
const INDEX_NAME = "riven-shared-logs";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

@Resolver()
export class ShareLogsResolver {
  @Mutation(() => String, {
    description:
      "Uploads the last 24 hours of ECS logs to Elasticsearch and returns the session ID for lookup.",
  })
  async shareLogs(): Promise<string> {
    const sessionId = SessionID.parse(getEnvironmentData("riven.session.id"));
    const logDir = path.resolve(process.cwd(), settings.logDirectory);
    const ecsLogPath = path.join(logDir, "ecs.json");
    const cutoff = Date.now() - MAX_AGE_MS;

    const logs = await this.readRecentLogs(ecsLogPath, cutoff);

    if (logs.length === 0) {
      throw new Error("No log entries found within the last 24 hours.");
    }

    await this.bulkIndex(logs);

    return sessionId;
  }

  private async readRecentLogs(
    filePath: string,
    cutoffMs: number,
  ): Promise<object[]> {
    const logs: object[] = [];

    const rl = createInterface({
      input: createReadStream(filePath, { encoding: "utf-8" }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line) as { "@timestamp"?: string };
        const timestamp = entry["@timestamp"];

        if (timestamp && new Date(timestamp).getTime() >= cutoffMs) {
          logs.push(entry);
        }
      } catch {
        // Skip malformed lines
      }
    }

    return logs;
  }

  private async bulkIndex(logs: object[]): Promise<void> {
    const body = logs
      .map((doc) => {
        const action = JSON.stringify({ index: { _index: INDEX_NAME } });
        const document = JSON.stringify(doc);
        return `${action}\n${document}`;
      })
      .join("\n")
      .concat("\n");

    const { statusCode, body: responseBody } = await request(
      `${ELASTICSEARCH_URL}/_bulk`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-ndjson",
          authorization: ELASTICSEARCH_AUTH,
        },
        body,
      },
    );

    if (statusCode >= 400) {
      const text = await responseBody.text();
      throw new Error(
        `Elasticsearch bulk index failed (${statusCode}): ${text}`,
      );
    }

    // Drain the response body
    await responseBody.text();
  }
}
