import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import { RankedResult } from "@repo/util-rank-torrent-name";

import { type } from "arktype";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-builder.ts";
import { createPluginResultSchema } from "../../../../utilities/create-flow-plugin-result-schema.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

export const MatchedFile = DebridFile.merge({
  matchedMediaItemId: "number.integer > 0",
  isCachedFile: "true",
  link: "string.url",
});

export type MatchedFile = typeof MatchedFile.infer;

export const ValidTorrent = type({
  torrentId: "string > 0",
  infoHash: "string.hex == 40",
  provider: "string | null",
  files: [MatchedFile, "...", MatchedFile.array()],
});

export type ValidTorrent = typeof ValidTorrent.infer;

export const FindValidTorrentFlow = createFlowSchema(
  "download-item.find-valid-torrent",
  {
    children: RankedResult.array(),
    input: type({
      id: "number.integer > 0",
      itemTitle: "string > 0",
      availableDownloaders: type({
        pluginName: "string",
        hasCacheCheckHook: "boolean",
        hasProviderListHook: "boolean",
      }).array(),
      failedInfoHashes: "'string.hex == 40'[]",
    }),
    output: createPluginResultSchema(ValidTorrent),
  },
);

export type FindValidTorrentFlow = typeof FindValidTorrentFlow.infer;

export const findValidTorrentProcessorSchema =
  FindValidTorrentFlow.get("processor");

export const createFindValidTorrentJob =
  createFlowJobBuilder(FindValidTorrentFlow);
