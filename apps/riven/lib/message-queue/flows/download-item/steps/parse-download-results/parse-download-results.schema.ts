import { MediaItemDownloadRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";
import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import {
  ParsedDataSchema,
  type RankedResult,
} from "@repo/util-rank-torrent-name";

import z from "zod";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-schema.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

const ParsedFile = z.object({
  file: DebridFile,
  parseData: ParsedDataSchema,
});

export const ParseDownloadResultsFlow = createFlowSchema(
  "download-item.parse-download-results",
  {
    children: z.array(z.custom<RankedResult>()),
    input: z.object({
      results: MediaItemDownloadRequestedResponse,
    }),
    output: z.object({
      episodes: z.record(z.string(), ParsedFile),
      movies: z.record(z.string(), ParsedFile),
    }),
  },
);

export type ParseDownloadResultsFlow = z.infer<typeof ParseDownloadResultsFlow>;

export const parseDownloadResultsProcessorSchema =
  ParseDownloadResultsFlow.shape.processor;

export const createParseDownloadResultsJob = createFlowJobBuilder(
  ParseDownloadResultsFlow,
);
