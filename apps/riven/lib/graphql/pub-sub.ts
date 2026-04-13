import { createPubSub } from "@graphql-yoga/subscription";

import type {
  ItemRequest,
  MediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

export const pubSub = createPubSub<{
  ITEM_REQUEST_CREATED: [ItemRequest];
  ITEM_REQUEST_UPDATED: [ItemRequest];
  MEDIA_ITEM_INDEXED: [MediaItem];
}>();
