import { expect } from "storybook/test";
import { INITIAL_VIEWPORTS } from "storybook/viewport";

import { preview } from "#.storybook/preview.tsx";

import { getLiveStatus, getQueues } from "./_data/queue-data.ts";
import { QueuesOverviewPage } from "./page.client.tsx";

const meta = preview.meta({
  title: "Pages / Queues",
  component: QueuesOverviewPage,
  args: {
    queues: getQueues(),
    liveStatus: getLiveStatus(),
    locale: "en-GB",
  },
});

export const Default = meta.story();

Default.test(
  "pauses and resumes live updates",
  async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole("heading", { name: "Queues", level: 1 }),
    ).toBeInTheDocument();

    await userEvent.click(
      canvas.getByRole("button", { name: "Pause updates" }),
    );

    await expect(
      canvas.getByRole("button", { name: "Resume updates" }),
    ).toBeInTheDocument();
  },
);

export const Disconnected = meta.story({
  args: {
    liveStatus: {
      ...getLiveStatus(),
      connectionStatus: "disconnected",
      reconnectAttempts: 3,
    },
  },
});

Disconnected.test("shows that the data is stale", async ({ canvas }) => {
  await expect(canvas.getByText(/^Showing data from/u)).toBeVisible();
});

export const Mobile = meta.story({
  parameters: { viewport: { options: INITIAL_VIEWPORTS } },
  globals: { viewport: { value: "mobile1", isRotated: false } },
});
