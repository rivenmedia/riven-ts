import { createPubSub } from "@graphql-yoga/subscription";

import type { MediaItemState } from "./enums/index.ts";
import type {
  ItemRequest,
  MediaItem,
  Movie,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

export const pubSub = createPubSub<{
  ITEM_REQUEST_CREATED: [ItemRequest];
  ITEM_REQUEST_UPDATED: [ItemRequest];
  MEDIA_ITEM_INDEXED: [Movie | Show];
  MEDIA_ITEM_SCRAPED: [
    {
      item: MediaItem;
      streamsAdded: number;
    },
  ];
  MEDIA_ITEM_DOWNLOADED: [
    {
      item: MediaItem;
      downloader: string;
      provider: string | null;
      durationFromRequestToDownload: number;
    },
  ];
  MEDIA_ITEM_STATE_CHANGED: [
    {
      item: MediaItem;
      stateChange: [oldState: MediaItemState, newState: MediaItemState];
    },
  ];
}>();
