import { createFormDecorator } from "@/.storybook/decorators/create-form-decorator";
import preview from "@/.storybook/preview";

import { DateTime } from "luxon";
import { expect, userEvent, within } from "storybook/test";

import { DatePicker } from "./date-picker";

const meta = preview.meta({
  title: "Components / DatePicker",
  component: DatePicker,
  args: {
    name: "date",
    placeholder: "YYYY-MM-DD",
    minDate: DateTime.fromObject({ year: 1900, month: 1, day: 1 }),
    maxDate: DateTime.fromObject({ year: 2100, month: 12, day: 31 }),
  },
  parameters: {
    layout: "padded",
  },
  decorators: [createFormDecorator()],
});

export const Default = meta.story();

Default.test(
  "Cannot select a date before a provided minDate",
  async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Open the datepicker", async () => {
      const input = await canvas.findByRole("button", {
        name: /open datepicker/iu,
      });

      await userEvent.click(input);
    });

    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(await body.findByRole("dialog"));

    await step("Select the year and month of the minDate", async () => {
      const yearSelect = await dialog.findByRole("combobox", {
        name: /choose the year/iu,
      });

      const monthSelect = await dialog.findByRole("combobox", {
        name: /choose the month/iu,
      });

      await userEvent.selectOptions(yearSelect, "1900");
      await userEvent.selectOptions(monthSelect, "Jan");
    });

    await step(
      "Verify that the previous month button is disabled",
      async () => {
        const previousMonthButton = await dialog.findByRole("button", {
          name: /previous month/iu,
        });

        await expect(previousMonthButton).toHaveAttribute(
          "aria-disabled",
          "true",
        );
      },
    );
  },
);

Default.test(
  "Cannot select a date after a provided maxDate",
  async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Open the datepicker", async () => {
      const input = await canvas.findByRole("button", {
        name: /open datepicker/iu,
      });

      await userEvent.click(input);
    });

    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(await body.findByRole("dialog"));

    await step("Select the year and month of the maxDate", async () => {
      const yearSelect = await dialog.findByRole("combobox", {
        name: /choose the year/iu,
      });

      const monthSelect = await dialog.findByRole("combobox", {
        name: /choose the month/iu,
      });

      await userEvent.selectOptions(yearSelect, "2100");
      await userEvent.selectOptions(monthSelect, "Dec");
    });

    await step("Verify that the next month button is disabled", async () => {
      const nextMonthButton = await dialog.findByRole("button", {
        name: /next month/iu,
      });

      await expect(nextMonthButton).toHaveAttribute("aria-disabled", "true");
    });
  },
);

Default.test(
  "Updates the datepicker when the input value is changed",
  async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const input = await canvas.findByRole("textbox", {
      name: /select a date/iu,
    });

    const expectedDate = DateTime.fromObject({
      year: 2023,
      month: 1,
      day: 15,
    });

    await userEvent.type(input, expectedDate.toISODate());

    await step("Open the datepicker", async () => {
      const datepickerButton = await canvas.findByRole("button", {
        name: /open datepicker/iu,
      });

      await userEvent.click(datepickerButton);
    });

    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(await body.findByRole("dialog"));

    await step("Select the year and month of the expected date", async () => {
      const yearSelect = await dialog.findByRole("combobox", {
        name: /choose the year/iu,
      });

      const monthSelect = await dialog.findByRole("combobox", {
        name: /choose the month/iu,
      });

      await userEvent.selectOptions(yearSelect, expectedDate.year.toString());
      await userEvent.selectOptions(monthSelect, expectedDate.toFormat("LLL"));
    });

    await step(
      "Verify that the correct date is selected in the datepicker",
      async () => {
        const selectedDateButton = await dialog.findByRole("button", {
          name: new RegExp(
            `${DateTime.now().day.toString()}(.*)+selected`,
            "iu",
          ),
        });

        await expect(selectedDateButton).toBeInTheDocument();
      },
    );
  },
);

export const WithDefaultValue = meta.story({
  args: {
    defaultValue: DateTime.now().toISODate(),
  },
});

WithDefaultValue.test(
  "Displays the default value in the input field",
  async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step(
      "Verify that the input field displays the default value",
      async () => {
        const input = await canvas.findByRole("textbox", {
          name: /select a date/iu,
        });

        const defaultValue = DateTime.now().toISODate();

        await expect(input).toHaveValue(defaultValue);
      },
    );
  },
);

WithDefaultValue.test(
  "Selects the correct date in the datepicker",
  async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Open the datepicker", async () => {
      const input = await canvas.findByRole("button", {
        name: /open datepicker/iu,
      });

      await userEvent.click(input);
    });

    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(await body.findByRole("dialog"));

    await step(
      "Verify that the correct date is selected in the datepicker",
      async () => {
        const selectedDateButton = await dialog.findByRole("button", {
          name: new RegExp(
            `${DateTime.now().day.toString()}(.*)+selected`,
            "iu",
          ),
        });

        await expect(selectedDateButton).toBeInTheDocument();
      },
    );
  },
);
