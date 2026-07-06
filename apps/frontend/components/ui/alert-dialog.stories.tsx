import { preview } from "@/.storybook/preview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { userEvent, within } from "storybook/test";

/**
 * A modal dialog that interrupts the user with important content and expects
 * a response.
 */
const meta = preview.meta({
  title: "ui/AlertDialog",
  component: AlertDialog,
  tags: ["autodocs"],
  argTypes: {},
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger>Open</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the alert dialog.
 */
export const Default = meta.story({});

Default.test(
  "When the trigger is pressed, it opens the dialog and allows it to be closed",
  async ({ canvasElement, canvas, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);

    await step("open the alert dialog", async () => {
      await userEvent.click(
        canvas.getByRole("button", {
          name: /open/i,
        }),
      );
    });

    await step("close the alert dialog", async () => {
      await userEvent.click(
        canvasBody.getByRole("button", {
          name: /cancel/i,
        }),
        { delay: 100 },
      );
    });
  },
);
