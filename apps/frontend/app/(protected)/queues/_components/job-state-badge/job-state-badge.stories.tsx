import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { JobStateBadge } from "./job-state-badge.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Components / JobStateBadge",
  component: JobStateBadge,
  args: { state: "waiting" },
});

export const Waiting = meta.story();

export const Prioritized = meta.story({ args: { state: "prioritized" } });

export const WaitingChildren = meta.story({
  args: { state: "waiting-children" },
});

export const Active = meta.story({ args: { state: "active" } });

export const Delayed = meta.story({ args: { state: "delayed" } });

Delayed.test("Labels the delayed state as Scheduled", async ({ canvas }) => {
  await expect(canvas.getByText("Scheduled")).toBeInTheDocument();
  await expect(canvas.queryByText(/delayed/iu)).not.toBeInTheDocument();
});

export const Failed = meta.story({ args: { state: "failed" } });

export const Completed = meta.story({ args: { state: "completed" } });

export const Paused = meta.story({ args: { state: "paused" } });
