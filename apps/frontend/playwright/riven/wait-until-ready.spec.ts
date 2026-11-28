// @vitest-environment node
import { spawn } from "node:child_process";
import { once } from "node:events";
import { it as baseIt, expect } from "vitest";

import { waitUntilReady } from "./wait-until-ready.ts";

const it = baseIt.extend("runningChild", ({}, { onCleanup }) => {
  const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 10_000)"]);

  onCleanup(() => {
    child.kill();
  });

  return child;
});

it("is ready once Riven reports it has started whilst the process runs", async ({
  runningChild,
}) => {
  const answers = [false, false, true];

  await expect(
    waitUntilReady({
      isStarted: () => Promise.resolve(answers.shift() ?? true),
      child: runningChild,
      timeoutMs: 5000,
    }),
  ).resolves.toBe(true);

  expect(answers).toStrictEqual([]);
});

it("keeps waiting whilst Riven isn't listening yet", async ({
  runningChild,
}) => {
  let attempts = 0;

  await expect(
    waitUntilReady({
      isStarted: () => {
        attempts += 1;

        return attempts < 3
          ? Promise.reject(new TypeError("fetch failed"))
          : Promise.resolve(true);
      },
      child: runningChild,
      timeoutMs: 5000,
    }),
  ).resolves.toBe(true);
});

it("isn't ready when Riven never finishes starting", async ({
  runningChild,
}) => {
  await expect(
    waitUntilReady({
      isStarted: () => Promise.resolve(false),
      child: runningChild,
      timeoutMs: 600,
    }),
  ).resolves.toBe(false);
});

it("isn't ready when another process answers after this one exited", async () => {
  const child = spawn(process.execPath, ["-e", ""]);

  await once(child, "exit");

  await expect(
    waitUntilReady({
      isStarted: () => Promise.resolve(true),
      child,
      timeoutMs: 5000,
    }),
  ).resolves.toBe(false);
});
