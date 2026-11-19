import type { Permissions } from "@repo/util-auth/access-control";
import type { MediaItemAction } from "@repo/util-plugin-sdk/dto/enums/media-item-action.enum";
import type { CamelCase } from "type-fest";

/**
 * The permissions required to perform each media item action. The mutation
 * behind each action requires these, and `availableActions` offers an action
 * only to callers who hold them.
 */
export const mediaItemActionPermissions = {
  requestSingle: { item: ["request"] },
  requestMultiple: { item: ["request"] },
  requestMore: { item: ["request"] },
  retry: { item: ["retry"] },
  reset: { item: ["reset"] },
  resume: { item: ["resume"] },
  pause: { item: ["pause"] },
  delete: { item: ["delete"] },
  blacklistActiveStream: { item: ["reset"] },
  manualScrape: { item: ["scrape"] },
} as const satisfies Record<CamelCase<MediaItemAction>, Permissions>;
