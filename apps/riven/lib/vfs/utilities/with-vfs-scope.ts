import { withLogContext } from "../../utilities/logger/log-context.ts";

import type { Promisable } from "type-fest";

/**
 * Wraps a VFS operation handler with a Sentry scope to provide extra log metadata.
 *
 * @param callback The callback that handles the VFS operation
 * @returns A Sentry scope pre-loaded with VFS meta tags
 */
export const withVfsScope = <T>(callback: () => Promisable<T>) =>
  withLogContext({ "riven.log.source": "vfs" }, callback);
