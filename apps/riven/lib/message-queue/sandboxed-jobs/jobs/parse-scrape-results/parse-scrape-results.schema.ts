import { MediaItemScrapeRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";
import { ParsedData } from "@repo/util-rank-torrent-name";

import { type } from "arktype";

import { createFlowJobBuilder } from "../../../utilities/create-flow-job-builder.ts";
import { createSandboxedJobSchema } from "../../utilities/create-sandboxed-job-schema.ts";

export const ParseScrapeResultsSandboxedJob = createSandboxedJobSchema(
  "scrape-item.parse-scrape-results",
  {
    children: MediaItemScrapeRequestedResponse,
    output: type({
      id: "number.integer >= 0",
      results: {
        "[string.hex == 40]": ParsedData,
      },
    }),
    input: type({
      id: "number.integer >= 0",
    }),
  },
);

export type ParseScrapeResultsSandboxedJob =
  typeof ParseScrapeResultsSandboxedJob.infer;

export const parseScrapeResultsProcessorSchema =
  ParseScrapeResultsSandboxedJob.get("processor");

export const createParseScrapeResultsJob = createFlowJobBuilder(
  ParseScrapeResultsSandboxedJob,
);
