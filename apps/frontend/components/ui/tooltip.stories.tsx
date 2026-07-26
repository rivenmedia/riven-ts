import { preview } from "@/.storybook/preview";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Plus } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

/**
 * A popup that displays information related to an element when the element
 * receives keyboard focus or the mouse hovers over it.
 */
const meta = preview.meta({
  title: "ui/Tooltip",
  component: TooltipContent,
  tags: ["autodocs"],
  argTypes: {
    side: {
      options: ["top", "bottom", "left", "right"],
      control: {
        type: "radio",
      },
    },
    children: {
      control: "text",
    },
  },
  args: {
    side: "top",
    children: "Add to library",
  },
  parameters: {
    layout: "centered",
  },
  render: (args) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add</span>
        </TooltipTrigger>
        <TooltipContent {...args} />
      </Tooltip>
    </TooltipProvider>
  ),
});

/**
 * The default form of the tooltip.
 */
export const Default = meta.story({});

/**
 * Use the `bottom` side to display the tooltip below the element.
 */
export const Bottom = meta.story({
  args: {
    side: "bottom",
  },
});

/**
 * Use the `left` side to display the tooltip to the left of the element.
 */
export const Left = meta.story({
  args: {
    side: "left",
  },
});

/**
 * Use the `right` side to display the tooltip to the right of the element.
 */
export const Right = meta.story({
  args: {
    side: "right",
  },
});

Default.test(
  "When hovering over the trigger, it shows the tooltip content",
  async ({ canvasElement, step }) => {
    const canvasBody = within(canvasElement.ownerDocument.body);
    const triggerBtn = await canvasBody.findByRole("button", { name: /add/i });

    await step("hover over trigger", async () => {
      await userEvent.hover(triggerBtn);
      await waitFor(() =>
        expect(
          canvasElement.ownerDocument.body.querySelector(
            "[data-radix-popper-content-wrapper]",
          ),
        ).toBeVisible(),
      );
    });

    await step("unhover trigger", async () => {
      await userEvent.unhover(triggerBtn);
      await waitFor(async () => {
        const tooltipElement = canvasElement.ownerDocument.body.querySelector(
          "[data-radix-popper-content-wrapper]",
        );

        await expect(tooltipElement).toBeNull();
      });
    });
  },
);
