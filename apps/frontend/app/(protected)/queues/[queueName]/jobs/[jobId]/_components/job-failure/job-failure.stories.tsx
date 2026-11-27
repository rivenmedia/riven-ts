import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { JobFailure } from "./job-failure.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Components / JobFailure",
  component: JobFailure,
  args: {
    reason: "No streams passed ranking (0 of 41)",
    stacktrace: [
      "Error: No streams passed ranking (0 of 41)",
      "    at scrapeItemProcessor (scrape-item.processor.ts:112:13)",
    ],
  },
});

export const Default = meta.story();

Default.test("Shows the reason and stack trace", async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: "Failure" })).toBeVisible();
  await expect(
    canvas.getByText("No streams passed ranking (0 of 41)", {
      selector: "p",
    }),
  ).toBeVisible();
  await expect(canvas.getByText(/scrape-item\.processor\.ts/u)).toBeVisible();
});

export const NoStackTrace = meta.story({ args: { stacktrace: [] } });

NoStackTrace.test("Omits the stack trace", async ({ canvas }) => {
  await expect(canvas.queryByText(/scrape-item\.processor\.ts/u)).toBeNull();
});
