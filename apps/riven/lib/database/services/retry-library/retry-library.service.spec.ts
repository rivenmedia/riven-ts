import { expect } from "vitest";

import { it } from "../../../__tests__/test-context.ts";

it("returns media items in retryable states", async ({
  services: { retryLibraryService },
  seeders: { seedIndexedMovie, seedCompletedMovie },
}) => {
  // Indexed movie should be retryable (state: "indexed")
  await seedIndexedMovie();

  // Completed movie should not be retryable
  await seedCompletedMovie();

  const items = await retryLibraryService.getMediaItemsToRetry();

  expect(items.length).toBeGreaterThanOrEqual(1);
  expect(items.every((item) => item.isRequested)).toBe(true);
});

it("returns item requests in failed or requested states", async ({
  services: { retryLibraryService, itemRequestService },
}) => {
  // Create a new item request (state: "requested")
  await itemRequestService.requestMovie({ imdbId: "tt7777777" });

  const requests = await retryLibraryService.getItemRequestsToRetry();

  expect(requests.length).toBeGreaterThanOrEqual(1);
  expect(
    requests.every((r) => r.state === "failed" || r.state === "requested"),
  ).toBe(true);
});
