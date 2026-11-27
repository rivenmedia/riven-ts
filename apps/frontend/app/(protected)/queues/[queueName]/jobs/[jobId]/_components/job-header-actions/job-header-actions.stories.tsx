import { expect, fn, within } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { JobHeaderActions } from "./job-header-actions.tsx";

const meta = preview.meta({
  component: JobHeaderActions,
  args: {
    jobId: "49012",
    queueLabel: "Process media item",
    canRetry: true,
    canRemove: true,
    disabled: false,
    onRetry: fn(),
    onRemove: fn(),
    onCopyLink: fn(),
  },
});

export const Default = meta.story();

Default.test("retries without asking", async ({ canvas, userEvent, args }) => {
  await userEvent.click(canvas.getByRole("button", { name: "Retry" }));

  await expect(args.onRetry).toHaveBeenCalledTimes(1);
});

Default.test(
  "removes only after confirming",
  async ({ canvas, canvasElement, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove" }));

    const dialog = await within(canvasElement.ownerDocument.body).findByRole(
      "alertdialog",
      { name: "Remove 1 job?" },
    );

    await expect(args.onRemove).not.toHaveBeenCalled();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Remove 1 job" }),
    );

    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
);

export const CopyOnly = meta.story({
  args: { canRetry: false, canRemove: false },
});

CopyOnly.test("offers only Copy link", async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: "Copy link" })).toBeEnabled();
  await expect(canvas.queryByRole("button", { name: "Retry" })).toBeNull();
  await expect(canvas.queryByRole("button", { name: "Remove" })).toBeNull();
});

export const Disabled = meta.story({ args: { disabled: true } });

Disabled.test("turns every action off", async ({ canvas }) => {
  for (const name of ["Retry", "Remove", "Copy link"]) {
    await expect(canvas.getByRole("button", { name })).toBeDisabled();
  }
});
