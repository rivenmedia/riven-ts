import { withLogContext } from "../../utilities/logger/log-context.ts";

/**
 * Wraps a VFS operation handler with a Sentry scope to provide extra log metadata.
 *
 * @param callback The callback that handles the VFS operation
 * @returns A Sentry scope pre-loaded with VFS meta tags
 */
export const withVfsScope = <T>(callback: () => Promise<T>) =>
  withLogContext({ "riven.log.source": "vfs" }, callback);
