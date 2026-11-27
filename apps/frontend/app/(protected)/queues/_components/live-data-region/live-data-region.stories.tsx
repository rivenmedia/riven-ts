import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { LiveDataRegion } from "./live-data-region.tsx";

const meta = preview.meta({
  component: LiveDataRegion,
  args: {
    locale: "en-GB",
    status: {
      connectionStatus: "connected",
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      lastUpdatedAt: "2026-11-26T13:52:00.000Z",
    },
    children: <p>14 jobs waiting</p>,
  },
});

export const Connected = meta.story();

Connected.test("shows no caption", async ({ canvas }) => {
  await expect(canvas.getByText("14 jobs waiting")).toBeInTheDocument();
  await expect(
    canvas.queryByText(/Showing data from/u),
  ).not.toBeInTheDocument();
});

export const Disconnected = meta.story({
  args: {
    status: {
      connectionStatus: "disconnected",
      reconnectAttempts: 5,
      maxReconnectAttempts: 5,
      lastUpdatedAt: "2026-11-26T13:52:00.000Z",
    },
  },
});

Disconnected.test("explains that the data is stale", async ({ canvas }) => {
  await expect(
    canvas.getByText(
      /^Showing data from \d{2}:\d{2}\. Actions are off until Riven reconnects\.$/u,
    ),
  ).toBeInTheDocument();
});
