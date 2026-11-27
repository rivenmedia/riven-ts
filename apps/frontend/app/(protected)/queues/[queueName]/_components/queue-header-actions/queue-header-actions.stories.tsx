import { expect, fn, waitFor, within } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { getQueue } from "../../../_data/queue-data.ts";
import { QueueHeaderActions } from "./queue-header-actions.tsx";

const fixtureQueue = (name: string) => {
  const queue = getQueue(name);

  if (!queue) {
    throw new Error(`Unknown fixture queue ${name}`);
  }

  return queue;
};

const meta = preview.meta({
  component: QueueHeaderActions,
  args: {
    queue: fixtureQueue("process-media-item"),
    disabled: false,
    onPause: fn(),
    onResume: fn(),
    onClean: fn(),
  },
});

export const Default = meta.story();

Default.test(
  "pauses after confirming",
  async ({ canvas, canvasElement, userEvent, args }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "Pause queue" }));
    await expect(args.onPause).not.toHaveBeenCalled();

    await waitFor(async () => {
      await expect(
        body.getByRole("alertdialog", { name: "Pause Process media item?" }),
      ).toBeVisible();
    });
    await userEvent.click(
      within(body.getByRole("alertdialog")).getByRole("button", {
        name: "Pause queue",
      }),
    );

    await expect(args.onPause).toHaveBeenCalledTimes(1);
  },
);

Default.test(
  "cleans completed jobs after confirming",
  async ({ canvas, canvasElement, userEvent, args }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "Clean" }));
    await userEvent.click(
      await body.findByRole("menuitem", { name: "Clean completed jobs" }),
    );
    await userEvent.click(
      await body.findByRole("button", { name: "Clean 4512 jobs" }),
    );

    await expect(args.onClean).toHaveBeenCalledWith("completed");
  },
);

Default.test(
  "does not clean when cancelled",
  async ({ canvas, canvasElement, userEvent, args }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "Clean" }));
    await userEvent.click(
      await body.findByRole("menuitem", { name: "Clean failed jobs" }),
    );
    await userEvent.click(await body.findByRole("button", { name: "Cancel" }));

    await expect(args.onClean).not.toHaveBeenCalled();
  },
);

export const Paused = meta.story({
  args: { queue: fixtureQueue("request-subtitles") },
});

Paused.test("resumes without asking", async ({ canvas, userEvent, args }) => {
  await userEvent.click(canvas.getByRole("button", { name: "Resume queue" }));

  await expect(args.onResume).toHaveBeenCalledTimes(1);
  await expect(canvas.queryByRole("alertdialog")).not.toBeInTheDocument();
});

export const Disabled = meta.story({ args: { disabled: true } });

Disabled.test("turns every action off", async ({ canvas }) => {
  await expect(
    canvas.getByRole("button", { name: "Pause queue" }),
  ).toBeDisabled();
  await expect(canvas.getByRole("button", { name: "Clean" })).toBeDisabled();
});
