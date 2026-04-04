import { type } from "arktype";

import {
  MovieContentRating,
  ShowContentRating,
} from "../../dto/enums/content-ratings.enum.ts";
import { ShowStatus } from "../../dto/enums/show-status.enum.ts";
import { ItemRequestInstance } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when an index has been requested for a newly created media item.
 */
export const MediaItemIndexRequestedEvent = createProgramEventSchema(
  "media-item.index.requested",
  type({
    item: ItemRequestInstance,
  }),
);

export type MediaItemIndexRequestedEvent =
  typeof MediaItemIndexRequestedEvent.infer;

const IndexedItem = type({
  id: "number",
  title: "string",
  genres: "string[]",
  "country?": "string | null",
  "rating?": "number | null",
  "aliases?": "Record<string, string[]> | null",
  "posterUrl?": "string | null",
  "language?": "string | null",
  imdbId: "string | null",
});

const ShowItem = IndexedItem.merge({
  type: /^show$/,
  contentRating: ShowContentRating,
  network: "string > 0 | null",
  status: ShowStatus,
  seasons: {
    "[string > 0]": {
      number: "number.integer >= 0",
      title: "string | null",
      episodes: {
        "[string > 0]": type({
          contentRating: ShowContentRating,
          absoluteNumber: "number.integer >= 0",
          number: "number.integer >= 0",
          title: "string",
          "posterUrl?": "string.url | null",
          airedAt: "string.date.iso | null",
          runtime: "number.integer > 0 | null",
        }).array(),
      },
    },
  },
});

const MovieItem = IndexedItem.merge({
  type: /^movie$/,
  releaseDate: "string.date.iso | null",
  contentRating: MovieContentRating,
  runtime: "number.integer > 0 | null",
});

export const MediaItemIndexRequestedResponse = type({
  item: ShowItem.or(MovieItem)
    .or("null")
    .describe(
      "The indexed media item data, or null if no indexing was performed",
    ),
});

export type MediaItemIndexRequestedResponse =
  typeof MediaItemIndexRequestedResponse.infer;

export const MediaItemIndexRequestedEventHandler = createEventHandlerSchema(
  MediaItemIndexRequestedEvent,
  MediaItemIndexRequestedResponse,
);
