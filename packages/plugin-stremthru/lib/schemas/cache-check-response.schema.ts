import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import { type } from "arktype";

import { ItemStatus } from "./item-status.schema.ts";

export const CacheCheckResponse = type({
  data: {
    items: type({
      files: DebridFile.array(),
      hash: "string.hex == 40",
      status: ItemStatus,
    }),
  },
});

export type CacheCheckResponse = typeof CacheCheckResponse.infer;
