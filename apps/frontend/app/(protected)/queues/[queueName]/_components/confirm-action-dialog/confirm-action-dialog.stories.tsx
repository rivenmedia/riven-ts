import { expect, fn, waitFor, within } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { removeConfirmCopy } from "../../_utilities/action-copy.ts";
import { ConfirmActionDialog } from "./confirm-action-dialog.tsx";

const meta = preview.meta({
  component: ConfirmActionDialog,
  args: {
    open: true,
    onOpenChange: fn(),
    onConfirm: fn(),
    copy: removeConfirmCopy(["49012", "48702"], "Process media item"),
  },
});

export const Default = meta.story();

Default.test(
  "confirms with the action's label",
  async ({ canvasElement, userEvent, args }) => {
    const body = within(canvasElement.ownerDocument.body);

    await waitFor(async () => {
      await expect(
        body.getByRole("alertdialog", { name: "Remove 2 jobs?" }),
      ).toBeVisible();
    });
    await expect(
      body.getByText(
        /^This deletes #49012 and #48702 from Process media item/u,
      ),
    ).toBeVisible();

    await userEvent.click(body.getByRole("button", { name: "Remove 2 jobs" }));

    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
);

Default.test(
  "cancels without confirming",
  async ({ canvasElement, userEvent, args }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(await body.findByRole("button", { name: "Cancel" }));

    await expect(args.onConfirm).not.toHaveBeenCalled();
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
);
