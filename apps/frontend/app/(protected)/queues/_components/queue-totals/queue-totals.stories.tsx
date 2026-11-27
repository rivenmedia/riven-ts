import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { getQueues } from "../../_data/queue-data.ts";
import { QueueTotals } from "./queue-totals.tsx";

import type { QueueSummary } from "../../_types/job-queue.ts";

const meta = preview.meta({
  title: "Pages / Queues / Components / QueueTotals",
  component: QueueTotals,
  args: { queues: getQueues(), locale: "en-GB" },
});

export const Default = meta.story();

Default.test("Shows the four totals in order", async ({ canvas }) => {
  const titles = ["Active", "Waiting", "Scheduled", "Failed"];

  for (const title of titles) {
    await expect(canvas.getByText(title)).toBeInTheDocument();
  }

  const positions = titles.map((title) =>
    canvas.getByText(title).compareDocumentPosition(canvas.getByText("Failed")),
  );

  await expect(positions.slice(0, 3)).toStrictEqual([
    Node.DOCUMENT_POSITION_FOLLOWING,
    Node.DOCUMENT_POSITION_FOLLOWING,
    Node.DOCUMENT_POSITION_FOLLOWING,
  ]);
});

Default.test("Shows failed jobs in the warning tone", async ({ canvas }) => {
  const failedValue = canvas.getByText("Failed").nextElementSibling;

  await expect(failedValue).toHaveClass("text-amber-300");
});

const withoutFailures = (queue: QueueSummary): QueueSummary => ({
  ...queue,
  counts: { ...queue.counts, failed: 0 },
});

export const NoFailures = meta.story({
  args: { queues: getQueues().map(withoutFailures) },
});

NoFailures.test("Keeps failed in the default tone", async ({ canvas }) => {
  const failedValue = canvas.getByText("Failed").nextElementSibling;

  await expect(failedValue).not.toHaveClass("text-amber-300");
});
