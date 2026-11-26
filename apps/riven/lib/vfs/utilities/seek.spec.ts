import { expect, it, vi } from "vitest";

import { withReadContext } from "#vfs/__tests__/with-read-context.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToResponsePromiseMap,
} from "#vfs/utilities/file-handle-map.ts";

import { seek } from "./seek.ts";

import type { Dispatcher } from "undici";

it("discards the current stream and signals the seek", async () => {
  expect.hasAssertions();

  const dump = vi.fn<() => Promise<void>>().mockResolvedValue();
  const responsePromise = Promise.resolve({
    body: { dump },
  } as unknown as Dispatcher.ResponseData);
  const seekController = new AbortController();

  fdToResponsePromiseMap.set(1, responsePromise);
  fdToResponsePromiseMap.set(2, responsePromise);
  fdToCurrentStreamPositionMap.set(1, 100);
  fdToCurrentStreamPositionMap.set(2, 200);

  await withReadContext(
    () => {
      seek(100, 5000);
    },
    {
      fd: 1,
      responsePromise,
      seekController,
    },
  );

  await vi.waitFor(() => {
    expect(dump).toHaveBeenCalledOnce();
  });

  expect(seekController.signal.aborted).toBe(true);
  expect(fdToResponsePromiseMap.has(1)).toBe(false);
  expect(fdToCurrentStreamPositionMap.has(1)).toBe(false);
  expect(fdToResponsePromiseMap.has(2)).toBe(true);
  expect(fdToCurrentStreamPositionMap.get(2)).toBe(200);
});

it("signals the seek when there is no stream to discard", async () => {
  const seekController = new AbortController();

  await withReadContext(
    () => {
      seek(100, 5000);
    },
    { seekController },
  );

  expect(seekController.signal.aborted).toBe(true);
});
