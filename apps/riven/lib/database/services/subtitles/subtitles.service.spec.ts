import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../../__tests__/test-context.ts";

it("returns the movie itself for subtitle processing", async ({
  services: { subtitlesService },
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  const items = await subtitlesService.getItemsForSubtitlesProcessing(movie.id);

  assert(items[0]);

  expect(items).toHaveLength(1);
  expect(items[0].id).toBe(movie.id);
});

it("returns episodes for a show for subtitle processing", async ({
  services: { subtitlesService },
  seeders: { seedCompletedShow },
}) => {
  const { show, episodes } = await seedCompletedShow();

  const items = await subtitlesService.getItemsForSubtitlesProcessing(show.id);

  assert(episodes);

  expect(items.length).toBe(episodes.length);
});

it("saves subtitles for a movie", async ({
  services: { subtitlesService },
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  const subtitles = new Map([
    [
      "en",
      {
        language: "en",
        content: "1\n00:00:01,000 --> 00:00:02,000\nHello",
        fileHash: "abc123",
        fileSize: 100,
        sourceProvider: "test-provider",
        sourceId: "sub-1",
      },
    ],
  ]);

  const count = await subtitlesService.saveSubtitles(movie.id, subtitles);

  expect(count).toBe(1);
});

it("deduplicates subtitles by language", async ({
  services: { subtitlesService },
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  const subtitles = new Map([
    [
      "en",
      {
        language: "en",
        content: "1\n00:00:01,000 --> 00:00:02,000\nHello",
        fileHash: "abc123",
        fileSize: 100,
        sourceProvider: "test-provider",
        sourceId: "sub-1",
      },
    ],
  ]);

  // First save
  await subtitlesService.saveSubtitles(movie.id, subtitles);

  // Second save with same language - should be skipped
  const count = await subtitlesService.saveSubtitles(movie.id, subtitles);

  expect(count).toBe(0);
});

it("saves multiple subtitles in different languages", async ({
  services: { subtitlesService },
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  const subtitles = new Map([
    [
      "en",
      {
        language: "en",
        content: "English content",
        fileHash: "en-hash",
        fileSize: 100,
        sourceProvider: "test-provider",
        sourceId: "sub-en",
      },
    ],
    [
      "fr",
      {
        language: "fr",
        content: "French content",
        fileHash: "fr-hash",
        fileSize: 120,
        sourceProvider: "test-provider",
        sourceId: "sub-fr",
      },
    ],
  ]);

  const count = await subtitlesService.saveSubtitles(movie.id, subtitles);

  expect(count).toBe(2);
});
