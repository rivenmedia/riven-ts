import { preview } from "@/.storybook/preview";

import { fn } from "storybook/test";

import { ErrorDisplay } from "./error-display";

const meta = preview.meta({
  title: "Logs Viewer / ErrorDisplay",
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
