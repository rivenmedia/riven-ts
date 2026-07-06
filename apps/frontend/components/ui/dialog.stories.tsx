import preview from "@/.storybook/preview";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { expect, userEvent, within } from "storybook/test";

/**
 * A window overlaid on either the primary window or another dialog window,
 * rendering the content underneath inert.
 */
const meta = preview.meta({
  title: "ui/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  argTypes: {},
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-4">
          <DialogClose className="hover:underline">Cancel</DialogClose>
          <DialogClose className="rounded bg-primary px-4 py-2 text-primary-foreground">
            Continue
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the dialog.
 */
export const Default = meta.story({});

Default.test(
  "When clicking the Continue button, it closes the dialog",
  async ({ canvasElement, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step("Open the dialog", async () => {
      await userEvent.click(
        await canvasBody.findByRole("button", { name: /open/i }),
      );

      const dialog = await canvasBody.findByRole("dialog");

      await expect(dialog).toBeInTheDocument();
      await expect(dialog).toHaveAttribute("data-state", "open");
    });

    await step("Close the dialog", async () => {
      await userEvent.click(
        await canvasBody.findByRole("button", { name: /continue/i }),
      );
      await expect(await canvasBody.findByRole("dialog")).toHaveAttribute(
        "data-state",
        "closed",
      );
    });
  },
);

Default.test(
  "When clicking the Cancel button, it closes the dialog",
  async ({ canvasElement, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step("Open the dialog", async () => {
      await userEvent.click(
        await canvasBody.findByRole("button", { name: /open/i }),
      );

      const dialog = await canvasBody.findByRole("dialog");

      await expect(dialog).toBeInTheDocument();
      await expect(dialog).toHaveAttribute("data-state", "open");
    });

    await step("Close the dialog", async () => {
      await userEvent.click(
        await canvasBody.findByRole("button", { name: /cancel/i }),
      );

      await expect(await canvasBody.findByRole("dialog")).toHaveAttribute(
        "data-state",
        "closed",
      );
    });
  },
);

Default.test(
  "When clicking the Close icon, it closes the dialog",
  async ({ canvasElement, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step("Open the dialog", async () => {
      await userEvent.click(
        await canvasBody.findByRole("button", { name: /open/i }),
      );

      const dialog = await canvasBody.findByRole("dialog");

      await expect(dialog).toBeInTheDocument();
      await expect(dialog).toHaveAttribute("data-state", "open");
    });

    await step("Close the dialog", async () => {
      await userEvent.click(
        await canvasBody.findByRole("button", { name: /close/i }),
      );

      await expect(await canvasBody.findByRole("dialog")).toHaveAttribute(
        "data-state",
        "closed",
      );
    });
  },
);
