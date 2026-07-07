import { DateTime } from "luxon";
import { action } from "storybook/actions";
import { expect, userEvent } from "storybook/test";

import { preview } from "@/.storybook/preview";
import { Calendar } from "@/components/ui/calendar";

/**
 * A date field component that allows users to enter and edit date.
 */
const meta = preview.meta({
  title: "ui/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  argTypes: {
    mode: {
      table: {
        disable: true,
      },
    },
    disabled: {
      control: "boolean",
    },
    numberOfMonths: {
      control: "number",
      description: "Number of months to display",
    },
    showOutsideDays: {
      control: "boolean",
      description: "Show days that fall outside the current month",
    },
  },
  args: {
    mode: "single",
    selected: DateTime.now().toJSDate(),
    onSelect: action("onDayClick"),
    className: "rounded-md border w-fit",
    disabled: false,
    numberOfMonths: 1,
    showOutsideDays: true,
  },
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the calendar.
 */
export const Default = meta.story({});

/**
 * Use the `multiple` mode to select multiple dates.
 */
export const Multiple = meta.story({
  args: {
    min: 1,
    selected: [
      DateTime.now().toJSDate(),
      DateTime.now().plus({ days: 2 }).toJSDate(),
      DateTime.now().plus({ days: 8 }).toJSDate(),
    ],
    mode: "multiple",
  },
});

/**
 * Use the `range` mode to select a range of dates.
 */
export const Range = meta.story({
  args: {
    selected: {
      from: DateTime.now().toJSDate(),
      to: DateTime.now().plus({ days: 7 }).toJSDate(),
    },
    mode: "range",
  },
});

/**
 * Use the `disabled` prop to disable specific dates.
 */
export const Disabled = meta.story({
  args: {
    disabled: [
      DateTime.now().plus({ days: 1 }).toJSDate(),
      DateTime.now().plus({ days: 2 }).toJSDate(),
      DateTime.now().plus({ days: 3 }).toJSDate(),
      DateTime.now().plus({ days: 5 }).toJSDate(),
    ],
  },
});

/**
 * Use the `numberOfMonths` prop to display multiple months.
 */
export const MultipleMonths = meta.story({
  args: {
    numberOfMonths: 2,
    showOutsideDays: false,
  },
});

Default.test(
  "When using the calendar navigation, it changes months",
  {
    args: {
      defaultMonth: DateTime.fromObject({ year: 2000, month: 9 }).toJSDate(),
    },
  },
  async ({ canvas }) => {
    const title = await canvas.findByText(/2000/i);
    const startTitle = title.textContent || "";

    const backBtn = await canvas.findByRole("button", {
      name: /previous/i,
    });

    const nextBtn = await canvas.findByRole("button", {
      name: /next/i,
    });

    const steps = 6;

    for (let i = 0; i < steps / 2; i++) {
      await userEvent.click(backBtn);
      await expect(title).not.toHaveTextContent(startTitle);
    }

    for (let i = 0; i < steps; i++) {
      await userEvent.click(nextBtn);

      if (i === steps / 2 - 1) {
        await expect(title).toHaveTextContent(startTitle);
        continue;
      }

      await expect(title).not.toHaveTextContent(startTitle);
    }
  },
);
