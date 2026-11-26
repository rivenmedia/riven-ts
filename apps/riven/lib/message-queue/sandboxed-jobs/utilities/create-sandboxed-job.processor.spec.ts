import { UnrecoverableError } from "bullmq";
import { AbortError } from "es-toolkit";
import { expect, it as baseIt, vi } from "vitest";

import { MapItemsToFilesSandboxedJob } from "#message-queue/sandboxed-jobs/jobs/map-items-to-files/map-items-to-files.schema.ts";

import { createSandboxedJobProcessor } from "./create-sandboxed-job.processor.ts";

import type { SandboxedJob } from "bullmq";

const sentry = vi.hoisted(() => ({
  captureException: vi.fn<(error: unknown) => string>(),
}));

vi.mock(import("@sentry/node"), async (importOriginal) => ({
  ...(await importOriginal()),
  captureException: sentry.captureException,
}));

type Processor = (input: { job: SandboxedJob }) => Promise<unknown>;

const createProcessor = (processor: Processor) =>
  createSandboxedJobProcessor(MapItemsToFilesSandboxedJob, processor as never);

const it = baseIt
  .extend("spyOnProcessExit", () => () => vi.spyOn(process, "exit"))
  .extend(
    "job",
    () => ({ id: "job-1", name: "map-items-to-files" }) as SandboxedJob,
  );

it.beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

  return () => {
    vi.useRealTimers();
  };
});

it("resolves with the processor result and exits the sandbox once idle", async ({
  spyOnProcessExit,
  job,
}) => {
  const exit = spyOnProcessExit().mockReturnValue(undefined as never);
  const result = { movies: {}, episodes: {} };
  const processor = vi.fn<Processor>().mockResolvedValue(result);

  await expect(createProcessor(processor)(job)).resolves.toBe(result);

  expect(processor).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ job }),
  );

  vi.advanceTimersByTime(4999);

  expect(exit).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1);

  expect(exit).toHaveBeenCalledExactlyOnceWith(0);
});

it("stays alive whilst jobs keep arriving", async ({
  spyOnProcessExit,
  job,
}) => {
  const exit = spyOnProcessExit().mockReturnValue(undefined as never);
  const processJob = createProcessor(
    vi.fn<Processor>().mockResolvedValue({ movies: {}, episodes: {} }),
  );

  await processJob(job);

  vi.advanceTimersByTime(4000);

  await processJob(job);

  vi.advanceTimersByTime(4000);

  expect(exit).not.toHaveBeenCalled();
});

it("reports and rethrows errors from the processor", async ({ job }) => {
  const error = new TypeError("Unexpected file list");

  await expect(
    createProcessor(vi.fn<Processor>().mockRejectedValue(error))(job),
  ).rejects.toBe(error);

  expect(sentry.captureException).toHaveBeenCalledExactlyOnceWith(error);
});

it("wraps non-error rejections in an unrecoverable error", async ({ job }) => {
  const rejection = createProcessor(
    vi.fn<Processor>().mockRejectedValue("plain failure"),
  )(job);

  await expect(rejection).rejects.toBeInstanceOf(UnrecoverableError);
  await expect(rejection).rejects.toThrow("plain failure");
});

it("rejects when the job is aborted", async ({ job }) => {
  const controller = new AbortController();
  const rejection = createProcessor(
    async () =>
      new Promise<never>(() => {
        // Never settles, so only the abort can end the job
      }),
  )(job, undefined, controller.signal);

  controller.abort();

  await expect(rejection).rejects.toBeInstanceOf(AbortError);
  await expect(rejection).rejects.toThrow("map-items-to-files aborted");
});
