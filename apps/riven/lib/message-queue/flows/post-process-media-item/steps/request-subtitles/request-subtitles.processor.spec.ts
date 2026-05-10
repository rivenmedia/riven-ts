import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";

import { it } from "../../../../../__tests__/test-context.ts";

it("deduplicates subtitles by language and saves them", async ({
  createMockJob,
  services,
}) => {
  const mediaItemId = randomUUID();

  const job = await createMockJob({
    mediaItem: { id: mediaItemId, fullTitle: "Test Movie" },
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "child-1": {
      subtitles: [
        {
          language: "en",
          data: "sub1",
          hash: "h1",
          fileSize: 100,
          encoding: "utf-8",
        },
        {
          language: "es",
          data: "sub2",
          hash: "h2",
          fileSize: 200,
          encoding: "utf-8",
        },
      ],
    },
    "child-2": {
      subtitles: [
        {
          language: "en",
          data: "sub3",
          hash: "h3",
          fileSize: 150,
          encoding: "utf-8",
        },
        {
          language: "fr",
          data: "sub4",
          hash: "h4",
          fileSize: 300,
          encoding: "utf-8",
        },
      ],
    },
  });

  vi.spyOn(services.subtitlesService, "saveSubtitles").mockResolvedValue(3);

  const { requestSubtitlesProcessor } =
    await import("./request-subtitles.processor.ts");

  const result = await requestSubtitlesProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent: vi.fn(), services, plugins: new Map() },
  );

  expect(services.subtitlesService.saveSubtitles).toHaveBeenCalledWith(
    mediaItemId,
    expect.any(Map),
  );

  const savedMap = vi.mocked(services.subtitlesService.saveSubtitles).mock
    .calls[0]![1] as Map<string, unknown>;
  expect(savedMap.size).toBe(3);
  expect(savedMap.has("en")).toBe(true);
  expect(savedMap.has("es")).toBe(true);
  expect(savedMap.has("fr")).toBe(true);

  expect(result).toEqual({ count: 3 });
});

it("returns count 0 when no subtitles are returned", async ({
  createMockJob,
  services,
}) => {
  const job = await createMockJob({
    mediaItem: { id: randomUUID(), fullTitle: "No Subs Movie" },
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "child-1": { subtitles: [] },
  });

  const { requestSubtitlesProcessor } =
    await import("./request-subtitles.processor.ts");

  const result = await requestSubtitlesProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent: vi.fn(), services, plugins: new Map() },
  );

  expect(result).toEqual({ count: 0 });
});
