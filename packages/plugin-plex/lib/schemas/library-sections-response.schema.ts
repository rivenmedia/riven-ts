import { type } from "arktype";

export const LibrarySectionsResponse = type({
  "MediaContainer?": {
    "Directory?": type({
      key: "string > 0",
      "Location?": type({
        path: "string > 0",
      }).array(),
    }).array(),
  },
});

export type LibrarySectionsResponse = typeof LibrarySectionsResponse.infer;
