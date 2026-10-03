import assert from "node:assert";

import { requestStreamLinkProcessorSchema } from "./request-stream-link.schema.ts";
import { blacklistStream } from "./steps/blacklist-stream/blacklist-stream.ts";
import { checkLinkHealth } from "./steps/check-link-health/check-link-health.ts";
import { processHealthCheckResponse } from "./steps/process-health-check-response/process-health-check-response.ts";
import { processStreamLinkResponse } from "./steps/process-stream-link-response/process-stream-link-response.ts";
import { requestStreamLink } from "./steps/request-stream-link/request-stream-link.ts";
import { saveHealthyLink } from "./steps/save-healthy-link/save-healthy-link.ts";

import type { StreamService } from "../../../database/services/stream/stream.service.ts";
import type { RequestStreamLinkFlow } from "./request-stream-link.schema.ts";
import type { Loaded } from "@mikro-orm/core";
import type { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

type RequestStreamLinkJob = Parameters<
  RequestStreamLinkFlow["processor"]
>[0]["job"];

export interface StepContext {
  job: RequestStreamLinkJob;
  token: string;
  mediaEntry: Loaded<MediaEntry, "mediaItem.fullTitle">;
  streamService: StreamService;
}

export const requestStreamLinkProcessor =
  requestStreamLinkProcessorSchema.implementAsync(
    async (
      { job, token },
      { services: { streamService, mediaEntryService } },
    ) => {
      assert.ok(token, "Token is required to create child jobs");

      const mediaEntry = await mediaEntryService.getMediaEntryById(
        job.data.mediaEntryId,
        { populate: ["mediaItem.fullTitle"] },
      );

      const stepContext = {
        job,
        token,
        mediaEntry,
        streamService,
      } as const satisfies StepContext;

      while (job.data.step !== "complete") {
        switch (job.data.step) {
          case "request-stream-link": {
            const cachedStreamLink = await requestStreamLink(stepContext);

            if (cachedStreamLink) {
              return cachedStreamLink;
            }

            break;
          }
          case "process-stream-link-response": {
            await processStreamLinkResponse(stepContext);

            break;
          }
          case "check-link-health": {
            await checkLinkHealth(stepContext);

            break;
          }
          case "process-health-check-response": {
            await processHealthCheckResponse(stepContext);

            break;
          }
          case "save-healthy-link": {
            await saveHealthyLink(stepContext);

            break;
          }
          case "blacklist-stream": {
            return blacklistStream(stepContext);
          }
        }
      }

      assert.ok(
        job.data.linkData,
        "No stream URL found after processing stream link request",
      );

      return job.data.linkData.link;
    },
  );
