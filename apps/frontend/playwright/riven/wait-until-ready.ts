import { setTimeout as delay } from "node:timers/promises";

import type { ChildProcess } from "node:child_process";

interface WaitUntilReadyInput {
  /** The URL the spawned Riven listens on */
  url: URL;

  /** The spawned Riven */
  child: ChildProcess;

  timeoutMs: number;
}

const pollIntervalMs = 250;

/**
 * Polls Riven's auth health check until it answers, while the spawned process is still running.
 *
 * Only an answer while `child` is alive counts, so a stale process on the same port can't pass for it.
 *
 * @returns Whether Riven became ready, rather than exiting or timing out
 */
export async function waitUntilReady({
  url,
  child,
  timeoutMs,
}: WaitUntilReadyInput) {
  const deadline = performance.now() + timeoutMs;
  const isAlive = () => child.exitCode === null && child.signalCode === null;

  while (isAlive() && performance.now() < deadline) {
    try {
      const response = await fetch(new URL("/api/auth/ok", url));

      if (response.ok && isAlive()) {
        return true;
      }
    } catch {
      // Not listening yet
    }

    await delay(pollIntervalMs);
  }

  return false;
}
