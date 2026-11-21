import { SubtitleEntry } from "@repo/util-plugin-sdk/dto/entities";

import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { queueNameFor } from "#message-queue/utilities/queue-name-for.ts";

import { requestSubtitlesProcessor } from "./request-subtitles.processor.ts";

import type { RequestSubtitlesFlow } from "./request-subtitles.schema.ts";
import type { SubtitleData } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";

const it = baseIt
  .extend(
    "subtitle",
    () =>
      (language: string, sourceProvider: string): SubtitleData => ({
        language,
        content: `1\n00:00:01,000 --> 00:00:02,000\n${language} from ${sourceProvider}\n`,
        fileHash: `${language}-${sourceProvider}`,
        fileSize: 64,
        sourceProvider,
      }),
  )
  .extend(
    "processWithChildren",
    ({
      completedMovieContext: { completedMovie },
      createMockJob,
      mockFlowProcessorContext,
      mockSentryScope,
    }) =>
      async (...childSubtitles: SubtitleData[][]) => {
        const job = await createMockJob<RequestSubtitlesFlow["input"]>({
          mediaItem: {
            id: completedMovie.id,
            fullTitle: completedMovie.fullTitle,
          },
        });

        vi.spyOn(job, "getChildrenValues").mockResolvedValue(
          Object.fromEntries(
            childSubtitles.map((subtitles) => [
              `bull:${queueNameFor("riven.media-item.subtitle.requested", "@repo/plugin-test")}:${randomUUID()}`,
              { subtitles },
            ]),
          ),
        );

        return requestSubtitlesProcessor(
          { job, token: "token", scope: mockSentryScope },
          mockFlowProcessorContext,
        );
      },
  );

it("saves nothing when no plugin returns subtitles", async ({
  completedMovieContext: { completedMovie },
  em,
  processWithChildren,
}) => {
  await expect(processWithChildren([], [])).resolves.toStrictEqual({
    count: 0,
  });

  await expect(
    em.count(SubtitleEntry, { mediaItem: completedMovie.id }),
  ).resolves.toBe(0);
});

it("saves the first subtitle returned for each language", async ({
  subtitle,
  completedMovieContext: { completedMovie },
  em,
  processWithChildren,
}) => {
  await expect(
    processWithChildren(
      [subtitle("en", "first"), subtitle("fr", "first")],
      [subtitle("en", "second"), subtitle("de", "second")],
    ),
  ).resolves.toStrictEqual({ count: 3 });

  const entries = await em.find(
    SubtitleEntry,
    { mediaItem: completedMovie.id },
    { orderBy: { language: "asc" } },
  );

  expect(
    entries.map(({ language, sourceProvider }) => ({
      language,
      sourceProvider,
    })),
  ).toStrictEqual([
    { language: "de", sourceProvider: "second" },
    { language: "en", sourceProvider: "first" },
    { language: "fr", sourceProvider: "first" },
  ]);
});

it("only counts subtitles for languages that were not already saved", async ({
  subtitle,
  processWithChildren,
}) => {
  await processWithChildren([subtitle("en", "first")]);

  await expect(
    processWithChildren([subtitle("en", "second"), subtitle("es", "second")]),
  ).resolves.toStrictEqual({ count: 1 });
});
