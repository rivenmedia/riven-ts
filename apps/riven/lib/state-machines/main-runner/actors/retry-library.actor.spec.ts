import { expect, vi } from "vitest";
import { createActor, waitFor } from "xstate";

import { it } from "../../../__tests__/test-context.ts";
import { retryLibrary } from "./retry-library.actor.ts";

it("sends scrape event for indexed items", async ({ services }) => {
  const sendSpy = vi.fn();

  vi.spyOn(
    services.retryLibraryService,
    "getMediaItemsToRetry",
  ).mockResolvedValue([
    { state: "indexed", id: "1", type: "movie", fullTitle: "Test Movie" },
  ] as never);
  vi.spyOn(
    services.retryLibraryService,
    "getItemRequestsToRetry",
  ).mockResolvedValue([]);

  const actor = createActor(retryLibrary, {
    input: { parentRef: { send: sendSpy } } as never,
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(sendSpy).toHaveBeenCalledWith({
    type: "riven.media-item.scrape.requested",
    item: expect.objectContaining({ state: "indexed" }),
  });
});

it("sends scrape event for partially_completed items", async ({ services }) => {
  const sendSpy = vi.fn();

  vi.spyOn(
    services.retryLibraryService,
    "getMediaItemsToRetry",
  ).mockResolvedValue([
    {
      state: "partially_completed",
      id: "2",
      type: "show",
      fullTitle: "Test Show",
    },
  ] as never);
  vi.spyOn(
    services.retryLibraryService,
    "getItemRequestsToRetry",
  ).mockResolvedValue([]);

  const actor = createActor(retryLibrary, {
    input: { parentRef: { send: sendSpy } } as never,
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(sendSpy).toHaveBeenCalledWith({
    type: "riven.media-item.scrape.requested",
    item: expect.objectContaining({ state: "partially_completed" }),
  });
});

it("sends retry-item-download event for scraped items", async ({
  services,
}) => {
  const sendSpy = vi.fn();

  vi.spyOn(
    services.retryLibraryService,
    "getMediaItemsToRetry",
  ).mockResolvedValue([
    { state: "scraped", id: "3", type: "movie", fullTitle: "Scraped Movie" },
  ] as never);
  vi.spyOn(
    services.retryLibraryService,
    "getItemRequestsToRetry",
  ).mockResolvedValue([]);

  const actor = createActor(retryLibrary, {
    input: { parentRef: { send: sendSpy } } as never,
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(sendSpy).toHaveBeenCalledWith({
    type: "riven-internal.retry-item-download",
    item: expect.objectContaining({ state: "scraped" }),
  });
});

it("sends index event for pending item requests", async ({ services }) => {
  const sendSpy = vi.fn();

  vi.spyOn(
    services.retryLibraryService,
    "getMediaItemsToRetry",
  ).mockResolvedValue([]);
  vi.spyOn(
    services.retryLibraryService,
    "getItemRequestsToRetry",
  ).mockResolvedValue([{ type: "movie", id: "req-1" }] as never);

  const actor = createActor(retryLibrary, {
    input: { parentRef: { send: sendSpy } } as never,
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(sendSpy).toHaveBeenCalledWith({
    type: "riven.media-item.index.requested.movie",
    item: expect.objectContaining({ id: "req-1" }),
  });
});

it("does nothing when there are no pending items or requests", async ({
  services,
}) => {
  const sendSpy = vi.fn();

  vi.spyOn(
    services.retryLibraryService,
    "getMediaItemsToRetry",
  ).mockResolvedValue([]);
  vi.spyOn(
    services.retryLibraryService,
    "getItemRequestsToRetry",
  ).mockResolvedValue([]);

  const actor = createActor(retryLibrary, {
    input: { parentRef: { send: sendSpy } } as never,
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(sendSpy).not.toHaveBeenCalled();
});

it("catches and logs errors without throwing", async ({ services }) => {
  vi.spyOn(
    services.retryLibraryService,
    "getMediaItemsToRetry",
  ).mockRejectedValue(new Error("DB error"));

  const actor = createActor(retryLibrary, {
    input: { parentRef: { send: vi.fn() } } as never,
  });

  actor.start();
  await waitFor(actor, (s) => s.status === "done");

  expect(actor.getSnapshot().status).toBe("done");
});
