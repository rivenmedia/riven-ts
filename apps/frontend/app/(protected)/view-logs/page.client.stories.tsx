import { preview } from "@/.storybook/preview";

import { LogsPage } from "./page.client";

const meta = preview.meta({
  title: "Pages / Logs",
  component: LogsPage,
});

export const LiveLogs = meta.story();

export const HistoricalLogs = meta.story({
  play: async ({ canvas, userEvent }) => {
    const historicalTabButton = canvas.getByRole("tab", {
      name: /historical logs/iu,
    });

    await userEvent.click(historicalTabButton);
  },
});
