import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { flow } from "#message-queue/flows/producer.ts";

import { enqueueRequestContentService } from "./enqueue-request-content-service.ts";

it("creates a root job to request content from the plugin", async () => {
  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);

  await enqueueRequestContentService("@repo/plugin-test");

  expect(addSpy).toHaveBeenCalledExactlyOnceWith(
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

it("delays the job by the given number of seconds", async () => {
  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);

  await enqueueRequestContentService("@repo/plugin-test", 60);

  expect(addSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      opts: expect.objectContaining({ delay: 60_000 }),
    }),
  );
});
