import { isMockTestMode } from "./is-mock-test-mode.ts";

/**
 * Whether an E2E Riven skips mounting its VFS, which it can only do in test mode.
 *
 * GitHub's hosted macOS runners can't load macFUSE's kernel extension, so a mount there never completes.
 * No E2E journey reads files through the mount.
 */
export const shouldSkipVfsMount = () =>
  isMockTestMode() &&
  // oxlint-disable-next-line turbo/no-undeclared-env-vars -- the E2E fixture sets it on the Riven it spawns, outside any turbo task
  process.env["E2E_SKIP_VFS_MOUNT"] === "true";
