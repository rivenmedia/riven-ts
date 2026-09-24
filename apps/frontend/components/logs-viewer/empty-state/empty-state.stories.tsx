import { preview } from "@/.storybook/preview";

import { fn } from "storybook/test";

import { EmptyState } from "./empty-state";

const meta = preview.meta({
  title: "Logs Viewer / EmptyState",
  component: EmptyState,
});

export const MessageOnly = meta.story({
  args: { message: "Connected. Waiting for live logs..." },
});

export const WithAction = meta.story({
  args: {
    message: "No historical logs found",
    actionText: "Refresh",
    actionFn: fn(),
  },
});
