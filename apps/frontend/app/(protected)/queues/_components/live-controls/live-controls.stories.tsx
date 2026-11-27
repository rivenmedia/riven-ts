import { expect, fn, mocked } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { FIXTURE_NOW } from "../../_fixtures/jobs.fixture.ts";
import { LiveControls } from "./live-controls.tsx";

const meta = preview.meta({
  component: LiveControls,
  args: {
    status: {
      connectionStatus: "connected",
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      lastUpdatedAt: FIXTURE_NOW,
    },
    isUpdatesPaused: false,
    onUpdatesPausedChange: fn(),
  },
});

export const Connected = meta.story();

Connected.test(
  "pauses updates when the button is clicked",
  async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: "Pause updates" });

    await expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);

    await expect(mocked(args.onUpdatesPausedChange)).toHaveBeenCalledWith(true);
  },
);

export const UpdatesPaused = meta.story({ args: { isUpdatesPaused: true } });

UpdatesPaused.test(
  "offers to resume updates",
  async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: "Resume updates" });

    await expect(button).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);

    await expect(mocked(args.onUpdatesPausedChange)).toHaveBeenCalledWith(
      false,
    );
  },
);

export const Reconnecting = meta.story({
  args: {
    status: {
      connectionStatus: "connecting",
      reconnectAttempts: 2,
      maxReconnectAttempts: 5,
      lastUpdatedAt: FIXTURE_NOW,
    },
  },
});
