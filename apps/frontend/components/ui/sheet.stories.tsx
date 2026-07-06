import { preview } from "@/.storybook/preview";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { expect, userEvent, within } from "storybook/test";

/**
 * Extends the Dialog component to display content that complements the main
 * content of the screen.
 */
const meta = preview.meta({
  title: "ui/Sheet",
  component: SheetContent,
  tags: ["autodocs"],
  argTypes: {
    side: {
      options: ["top", "bottom", "left", "right"],
      control: {
        type: "radio",
      },
    },
  },
  args: {
    side: "right",
  },
  render: (args) => (
    <Sheet>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent {...args}>
        <SheetHeader>
          <SheetTitle>Are you absolutely sure?</SheetTitle>
          <SheetDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose className="hover:underline">Cancel</SheetClose>
          <SheetClose className="rounded bg-primary px-4 py-2 text-primary-foreground">
            Submit
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the sheet.
 */
export const Default = meta.story({});

Default.test(
  "When clicking the Submit button, it closes the sheet",
  async ({ canvasElement, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step("open the sheet", async () => {
      await userEvent.click(
        await canvasBody.findByRole("button", { name: /open/i }),
      );

      const sheet = await canvasBody.findByRole("dialog");

      await expect(sheet).toBeInTheDocument();
      await expect(sheet).toHaveAttribute("data-state", "open");
    });

    await step("close the sheet", async () => {
      await userEvent.click(
        await canvasBody.findByRole("button", { name: /submit/i }),
      );

      await expect(await canvasBody.findByRole("dialog")).toHaveAttribute(
        "data-state",
        "closed",
      );
    });
  },
);

Default.test(
  "When clicking the Cancel button, it closes the sheet",
  async ({ canvasElement, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step("open the sheet", async () => {
      await userEvent.click(
        await canvasBody.findByRole("button", { name: /open/i }),
      );
      const sheet = await canvasBody.findByRole("dialog");

      await expect(sheet).toBeInTheDocument();
      await expect(sheet).toHaveAttribute("data-state", "open");
    });

    await step("close the sheet", async () => {
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
  "When clicking the Close icon, it closes the sheet",
  async ({ canvasElement, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step("open the sheet", async () => {
      await userEvent.click(
        await canvasBody.findByRole("button", { name: /open/i }),
      );

      const sheet = await canvasBody.findByRole("dialog");

      await expect(sheet).toBeInTheDocument();
      await expect(sheet).toHaveAttribute("data-state", "open");
    });

    await step("close the sheet", async () => {
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
