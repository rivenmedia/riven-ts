import { expect, fn } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { PausedQueueBanner } from "./paused-queue-banner.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Components / PausedQueueBanner",
  component: PausedQueueBanner,
  args: {
    queueLabel: "Request subtitles",
    disabled: false,
    onResume: fn(),
  },
});

export const Default = meta.story();

Default.test(
  "Explains the pause and resumes",
  async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText("Request subtitles is paused")).toBeVisible();
    await expect(
      canvas.getByText("New jobs wait here until you resume it."),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Resume queue" }));

    await expect(args.onResume).toHaveBeenCalledTimes(1);
  },
);

export const Disabled = meta.story({ args: { disabled: true } });

Disabled.test("Turns the action off", async ({ canvas }) => {
  await expect(
    canvas.getByRole("button", { name: "Resume queue" }),
  ).toBeDisabled();
});
