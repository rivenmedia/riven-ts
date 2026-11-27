import { expect, fn } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { EmptyState } from "#components/empty-state/empty-state.tsx";

const meta = preview.meta({
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

export const WithDescription = meta.story({
  args: {
    message: "No failed jobs",
    description: "Jobs land here once they've used up their retries.",
  },
});

WithDescription.test("shows the description", async ({ canvas }) => {
  await expect(
    canvas.getByText("Jobs land here once they've used up their retries."),
  ).toBeVisible();
});
