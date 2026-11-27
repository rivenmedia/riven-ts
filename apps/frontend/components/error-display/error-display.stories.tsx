import { expect, fn } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { ErrorDisplay } from "#components/error-display/error-display.tsx";

const meta = preview.meta({
  title: "Components / ErrorDisplay",
  component: ErrorDisplay,
  args: {
    errorMessage:
      "WebSocket connection refused: connect ECONNREFUSED 127.0.0.1:8080",
    retryAction: fn(),
  },
});

export const Default = meta.story();

export const CustomButtonText = meta.story({
  args: { buttonText: "Reconnect" },
});

export const CustomTitle = meta.story({
  args: { title: "Couldn't load queues" },
});

CustomTitle.test("Shows the custom title", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", { name: "Couldn't load queues" }),
  ).toBeInTheDocument();
  await expect(
    canvas.queryByText("Error Loading Logs"),
  ).not.toBeInTheDocument();
});
