import { fn } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { ErrorDisplay } from "#components/error-display/error-display.tsx";

const meta = preview.meta({
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
