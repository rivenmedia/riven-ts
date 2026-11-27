import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { ThroughputPlaceholder } from "./throughput-placeholder.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Components / ThroughputPlaceholder",
  component: ThroughputPlaceholder,
});

export const Overview = meta.story({ args: { variant: "overview" } });

Overview.test("Explains that the chart is parked", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", { name: "Throughput" }),
  ).toBeInTheDocument();
  await expect(
    canvas.getByText(
      "Completed and failed jobs over time. Parked until BullMQ metrics are switched on in the workers.",
    ),
  ).toBeInTheDocument();

  for (const name of ["1h", "24h", "7d", "14d"]) {
    await expect(canvas.getByRole("button", { name })).toBeDisabled();
  }
});

export const Queue = meta.story({ args: { variant: "queue" } });

Queue.test("Explains that the chart is parked", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", { name: "Throughput for this queue" }),
  ).toBeInTheDocument();
  await expect(
    canvas.getByText("Parked until BullMQ metrics are switched on."),
  ).toBeInTheDocument();

  for (const button of canvas.getAllByRole("button")) {
    await expect(button).toBeDisabled();
  }
});
