import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import { enqueueRequestContentService } from "./enqueue-request-content-service.ts";

it("creates a root job to request content from the plugin", async ({
  flowAddSpy,
}) => {
  await enqueueRequestContentService("@repo/plugin-test");

  expect(flowAddSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      name: "Request content: @repo/plugin-test",
      queueName: "request-content-services",
      data: { step: "request", contentServicePlugin: "@repo/plugin-test" },
      opts: {
        deduplication: { id: "request-content-service-@repo/plugin-test" },
      },
    }),
  );
});

it("delays the job by the given number of seconds", async ({ flowAddSpy }) => {
  await enqueueRequestContentService("@repo/plugin-test", 60);

  expect(flowAddSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      opts: expect.objectContaining({ delay: 60_000 }),
    }),
  );
});
