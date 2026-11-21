import { WaitingChildrenError } from "bullmq";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { flow } from "#message-queue/flows/producer.ts";

import { postProcessItemProcessor } from "./post-process-media-item.processor.ts";

import type { PostProcessMediaItemFlow } from "./post-process-media-item.schema.ts";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

const it = baseIt
  .extend(
    "processJob",
    ({ mockFlowProcessorContext, mockSentryScope }) =>
      async (job: Parameters<typeof postProcessItemProcessor>[0]["job"]) =>
        postProcessItemProcessor(
          { job, token: "token", scope: mockSentryScope },
          mockFlowProcessorContext,
        ),
  )
  .extend(
    "removeSubtitleSubscribers",
    ({ mockFlowProcessorContext: { plugins } }) =>
      () => {
        for (const [name, plugin] of plugins) {
          plugins.set(name, {
            ...plugin,
            config: { ...plugin.config, hooks: {} },
          });
        }
      },
  )
  .extend(
    "createProcessorJob",
    ({ createMockJob }) =>
      async (
        item: Pick<MediaItem, "id" | "type" | "fullTitle">,
        step: PostProcessMediaItemFlow["input"]["step"],
        { ignoredChildren = 0, hasPendingChildren = false } = {},
      ) => {
        const job = await createMockJob<PostProcessMediaItemFlow["input"]>({
          step,
          mediaItem: {
            id: item.id,
            type: item.type,
            fullTitle: item.fullTitle,
          },
        });

        vi.spyOn(job, "updateData").mockImplementation(async (newData) => {
          job.data = newData;

          return Promise.resolve();
        });
        vi.spyOn(job, "moveToWaitingChildren").mockResolvedValue(
          hasPendingChildren,
        );
        vi.spyOn(job, "getDependenciesCount").mockResolvedValue({
          ignored: ignoredChildren,
        });

        return job;
      },
  );

it("requests subtitles from each subscribed plugin and waits for them", async ({
  createProcessorJob,
  processJob,
  completedMovieContext: { completedMovie },
}) => {
  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);

  const job = await createProcessorJob(completedMovie, "post-process", {
    hasPendingChildren: true,
  });

  await expect(processJob(job)).rejects.toBeInstanceOf(WaitingChildrenError);

  expect(addSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      name: `Requesting subtitles for ${completedMovie.fullTitle}`,
      data: {
        mediaItem: {
          id: completedMovie.id,
          fullTitle: completedMovie.fullTitle,
        },
      },
      opts: expect.objectContaining({
        parent: { id: job.id, queue: job.queueQualifiedName },
      }),
      children: [
        expect.objectContaining({
          queueName:
            "riven.media-item.subtitle.requested.plugin[@repo/plugin-test]",
        }),
      ],
    }),
  );
  expect(job.data.step).toBe("validate-post-process");
});

it("completes without requesting subtitles when no plugin subscribes", async ({
  removeSubtitleSubscribers,
  createProcessorJob,
  processJob,
  completedMovieContext: { completedMovie },
}) => {
  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);

  removeSubtitleSubscribers();

  const job = await createProcessorJob(completedMovie, "post-process");

  await expect(processJob(job)).resolves.toBeUndefined();

  expect(addSpy).not.toHaveBeenCalled();
  expect(job.data.step).toBe("complete");
});

it("completes when some subtitle requests failed", async ({
  createProcessorJob,
  processJob,
  completedMovieContext: { completedMovie },
}) => {
  const job = await createProcessorJob(
    completedMovie,
    "validate-post-process",
    { ignoredChildren: 1 },
  );

  await expect(processJob(job)).resolves.toBeUndefined();

  expect(job.data.step).toBe("complete");
});
