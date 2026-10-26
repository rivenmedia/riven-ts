import { createPubSub } from "@graphql-yoga/subscription";

import type { MediaItemState } from "#types/__generated__/graphql.ts";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

export const pubSub = createPubSub<{
  MEDIA_ITEM_STATE_CHANGED: [
    {
      item: MediaItem;
      stateChange: [oldState: MediaItemState, newState: MediaItemState];
    },
  ];
}>();
