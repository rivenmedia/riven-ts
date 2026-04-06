import { createPubSub } from "@graphql-yoga/subscription";

import type { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

export const pubSub = createPubSub<{
  SHOW_REQUEST_CREATED: [ItemRequest];
}>();
