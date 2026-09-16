import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

import type { Store } from "../schemas/store.schema.ts";

/**
 * Returns a set of status codes that are considered to indicate an expired link for the given store.
 *
 * @param store - The store for which to retrieve the expired link status codes.
 * @returns A set of status codes that indicate an expired link for the specified store.
 *
 * @see {@link StatusCodes}
 * @see {@link Store}
 */
export function storeExpiredLinkStatusCodes(store: Store): Set<StatusCodes> {
  switch (store) {
    case "premiumize": {
      return new Set([StatusCodes.FORBIDDEN]);
    }
    case "torbox": {
      return new Set([StatusCodes.BAD_REQUEST]);
    }
    case "alldebrid":
    case "debridlink":
    case "realdebrid":
    case "debrider":
    case "easydebrid":
    case "offcloud":
    case "pikpak": {
      return new Set();
    }
  }
}
