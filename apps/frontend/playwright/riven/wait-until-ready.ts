import { setTimeout as delay } from "node:timers/promises";

import type { ChildProcess } from "node:child_process";

interface WaitUntilReadyInput {
  /** Asks the spawned Riven whether it has finished starting. It rejects whilst Riven isn't listening yet. */
  isStarted: () => Promise<boolean>;

  /** The spawned Riven */
  child: ChildProcess;

  timeoutMs: number;
}

const pollIntervalMs = 250;

/**
 * Polls Riven until it has finished starting, while the spawned process is still running.
 *
 * Riven's API answers before the rest of it, such as the VFS, has started, and the events a request sends go unhandled until then.
 * Only an answer while `child` is alive counts, so a stale process on the same port can't pass for it.
 *
 * @returns Whether Riven became ready, rather than exiting or timing out
 */
export async function waitUntilReady({
  isStarted,
  child,
  timeoutMs,
}: WaitUntilReadyInput) {
  const deadline = performance.now() + timeoutMs;
  const isAlive = () => child.exitCode === null && child.signalCode === null;

  while (isAlive() && performance.now() < deadline) {
    try {
      if ((await isStarted()) && isAlive()) {
        return true;
      }
    } catch {
      // Not listening yet
    }

    await delay(pollIntervalMs);
  }

  return false;
}
