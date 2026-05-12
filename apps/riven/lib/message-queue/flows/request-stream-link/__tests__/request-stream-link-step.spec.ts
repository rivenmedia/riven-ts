import { expect, vi } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { createFlowWorker } from "../../../utilities/create-flow-worker.ts";
import { queueNameFor } from "../../../utilities/queue-name-for.ts";
import { flow } from "../../producer.ts";
import { enqueueRequestStreamLink } from "../enqueue-request-stream-link.ts";
import { requestStreamLinkProcessor } from "../request-stream-link.processor.ts";
import { RequestStreamLinkFlow } from "../request-stream-link.schema.ts";

import type { TypedJobNode } from "bullmq";

it.beforeAll(() => {
  createFlowWorker(
    RequestStreamLinkFlow,
    requestStreamLinkProcessor,
    vi.fn(),
    new Map(),
  );
});

it.concurrent(
  "requests the stream link from the plugin associated with the media entry",
  async ({ completedMovieContext: { completedMovie } }) => {
    const [mediaEntry] = await completedMovie.getMediaEntries();

    expect.assert(mediaEntry);

    const { job } = await enqueueRequestStreamLink({
      mediaEntry,
    });

    await vi.waitFor(async () => {
      expect.assert(job.id);

      const { children } = await flow.getFlow({
        id: job.id,
        queueName: job.queueName,
      });

      expect.assert(children?.[0]);

      expect(children[0].job.queueName).toBe(
        queueNameFor(
          "riven.media-item.stream-link.requested",
          mediaEntry.plugin,
        ),
      );
    });
  },
);

it.concurrent(
  'moves the job to the "validate-link" step after requesting the stream link',
  async ({ completedMovieContext: { completedMovie } }) => {
    const [mediaEntry] = await completedMovie.getMediaEntries();

    expect.assert(mediaEntry);

    const requestStreamLinkNode = await enqueueRequestStreamLink({
      mediaEntry,
    });

    await vi.waitFor(async () => {
      expect.assert(requestStreamLinkNode.job.id);

      const {
        job,
      }: TypedJobNode<
        RequestStreamLinkFlow["input"],
        RequestStreamLinkFlow["output"]
      > = await flow.getFlow({
        id: requestStreamLinkNode.job.id,
        queueName: requestStreamLinkNode.job.queueName,
      });

      expect(job.data.step).toBe("validate-response");
    });
  },
);
