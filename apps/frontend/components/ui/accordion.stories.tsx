import { preview } from "@/.storybook/preview";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { expect, userEvent, waitFor, within } from "storybook/test";

/**
 * A vertically stacked set of interactive headings that each reveal a section
 * of content.
 */
const meta = preview.meta({
  title: "ui/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "radio",
      description: "Type of accordion behavior",
      options: ["single", "multiple"],
    },
    collapsible: {
      control: "boolean",
      description: "Can an open accordion be collapsed using the trigger",
      if: { arg: "type", eq: "single" },
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    collapsible: true,
    disabled: false,
  },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          {
            "Yes. It comes with default styles that matches the other components' aesthetic."
          }
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          {
            "Yes. It's animated by default, but you can disable it if you prefer."
          }
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
});

/**
 * The default behavior of the accordion allows only one item to be open.
 */
export const Single = meta.story({
  args: {
    type: "single",
  },
});

Single.test(
  "When accordions are clicked, it allows only one item to be open at a time",
  async ({ canvasElement }) => {
    const canvas = within(
      canvasElement.querySelector('[data-slot="accordion"]') ?? canvasElement,
    );
    const accordions = canvas.getAllByRole("button");

    // Open the tabs one at a time
    for (const trigger of accordions) {
      await userEvent.click(trigger);
      await waitFor(async () => {
        const content = await canvas.findAllByRole("region");
        await expect(content.length).toBe(1);
      });
    }

    const lastTab = accordions[accordions.length - 1];

    if (!lastTab) {
      throw new Error("Could not find the last accordion trigger");
    }

    // Close the last opened tab
    await userEvent.click(lastTab);
    await waitFor(async () => {
      const content = canvas.queryByRole("region");

      return expect(content).toBeFalsy();
    });
  },
);

export const Multiple = meta.story({
  args: {
    type: "multiple",
  },
});

Multiple.test(
  "When accordions are clicked, it allows multiple items to be open",
  async ({ canvasElement }) => {
    const canvas = within(
      canvasElement.querySelector('[data-slot="accordion"]') ?? canvasElement,
    );
    const accordions = canvas.getAllByRole("button");

    // Open all tabs one at a time
    for (let i = 0; i < accordions.length; i++) {
      const trigger = accordions[i];

      if (!trigger) {
        continue;
      }

      await userEvent.click(trigger);

      await waitFor(async () => {
        const content = await canvas.findAllByRole("region");

        return expect(content.length).toBe(i + 1);
      });
    }

    // Close all tabs one at a time
    for (let i = accordions.length - 1; i > 0; i--) {
      const trigger = accordions[i];

      if (!trigger) {
        continue;
      }

      await userEvent.click(trigger);
      await waitFor(async () => {
        const content = await canvas.findAllByRole("region");
        return expect(content.length).toBe(i);
      });
    }

    const [lastOpenedTab] = accordions;

    if (!lastOpenedTab) {
      throw new Error("Could not find the last opened accordion trigger");
    }

    // Close the last opened tab
    await userEvent.click(lastOpenedTab);
    await waitFor(async () => {
      const content = canvas.queryByRole("region");
      return expect(content).toBeFalsy();
    });
  },
);
