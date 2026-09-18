import { createFormDecorator } from "@/.storybook/decorators/create-form-decorator";
import { preview } from "@/.storybook/preview";

import { expect, userEvent, within } from "storybook/test";

import { SettingField } from "./setting-field";

const meta = preview.meta({
  title: "Settings / SettingField",
  component: SettingField,
});

export const Text = meta.story({
  args: {
    type: "text",
    config: {
      label: "Instance Name",
      name: "instance-name",
    },
  },
  decorators: [
    createFormDecorator({
      progressive: true,
      defaultValues: { "instance-name": "My Riven Instance" },
    }),
  ],
});

Text.test("Typing updates the input value", async ({ canvas }) => {
  const input = canvas.getByRole("textbox", { name: /instance name/iu });

  await userEvent.clear(input);
  await userEvent.type(input, "Lorem ipsum dolor sit amet");

  await expect(input).toHaveValue("Lorem ipsum dolor sit amet");
});

export const Secret = meta.story({
  args: {
    type: "secret",
    config: {
      label: "API Key",
      name: "api-key",
    },
  },
  decorators: [
    createFormDecorator({
      progressive: true,
      defaultValues: {
        "api-key": "1234567890",
      },
    }),
  ],
});

Secret.test(
  "Clicking the eye icon toggles secret visibility",
  async ({ canvas, step }) => {
    const input = canvas.getByLabelText(/api key/iu);

    await step("Hidden by default", async () => {
      await expect(input).toHaveAttribute("type", "password");
    });

    await step("Reveals the value when shown", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: /show password/iu }),
      );

      await expect(input).toHaveAttribute("type", "text");
    });

    await step("Hides the value again", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: /hide password/iu }),
      );

      await expect(input).toHaveAttribute("type", "password");
    });
  },
);

export const Number = meta.story({
  args: {
    type: "number",
    config: {
      label: "Max Workers",
      name: "max-workers",
      registerOptions: { min: 0 },
    },
  },
  decorators: [
    createFormDecorator({
      progressive: true,
      defaultValues: { "max-workers": 1 },
    }),
  ],
});

Number.test("Typing updates the input value", async ({ canvas }) => {
  const input = canvas.getByRole("spinbutton", { name: /max workers/iu });

  await userEvent.clear(input);
  await userEvent.type(input, "8");

  await expect(input).toHaveValue(8);
});

export const Boolean = meta.story({
  args: {
    type: "boolean",
    config: {
      label: "Enable Notifications",
      name: "enable-notifications",
    },
  },
  decorators: [
    createFormDecorator({
      progressive: true,
      defaultValues: { "enable-notifications": true },
    }),
  ],
});

Boolean.test(
  "Clicking the switch toggles it off and on",
  async ({ canvas, step }) => {
    const toggle = canvas.getByRole("switch", {
      name: /enable notifications/iu,
    });

    await step("Checked by default", async () => {
      await expect(toggle).toBeChecked();
    });

    await step("Toggle off", async () => {
      await userEvent.click(toggle);
      await expect(toggle).not.toBeChecked();
    });

    await step("Toggle on", async () => {
      await userEvent.click(toggle);
      await expect(toggle).toBeChecked();
    });
  },
);

export const NullableBoolean = meta.story({
  args: {
    type: "nullable_boolean",
    config: {
      label: "Auto Scrape",
      name: "auto-scrape",
      trueLabel: "Always",
      falseLabel: "Never",
    },
  },
  decorators: [
    createFormDecorator({
      progressive: true,
      defaultValues: { "auto-scrape": null },
    }),
  ],
});

NullableBoolean.test(
  "Selecting an option updates the displayed value",
  async ({ canvasElement, step }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = body.getByRole("combobox");

    await step("Defaults to Any", async () => {
      await expect(trigger).toHaveTextContent("Any");
    });

    await step("Selects Always", async () => {
      await userEvent.click(trigger);
      await userEvent.click(
        await body.findByRole("option", { name: "Always" }),
      );

      await expect(trigger).toHaveTextContent("Always");
    });

    await step("Selects Never", async () => {
      await userEvent.click(trigger);
      await userEvent.click(await body.findByRole("option", { name: "Never" }));

      await expect(trigger).toHaveTextContent("Never");
    });
  },
);

export const Select = meta.story({
  args: {
    type: "select",
    config: {
      label: "Preferred Resolution",
      name: "preferred-resolution",
      options: [
        { value: "2160p", label: "2160p" },
        { value: "1080p", label: "1080p" },
        { value: "720p", label: "720p" },
        { value: "480p", label: "480p" },
      ],
    },
  },
  decorators: [
    createFormDecorator({
      progressive: true,
      defaultValues: { "preferred-resolution": "1080p" },
    }),
  ],
});

Select.test(
  "Selecting an option updates the displayed value",
  async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = body.getByRole("combobox");

    await expect(trigger).toHaveTextContent("1080p");

    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole("option", { name: "720p" }));

    await expect(trigger).toHaveTextContent("720p");
  },
);

export const StringArray = meta.story({
  args: {
    type: "string_array",
    config: {
      label: "Excluded Words",
      name: "excluded-words",
    },
  },
  decorators: [
    createFormDecorator({
      progressive: true,
      defaultValues: { "excluded-words": ["CAM", "TS", "WORKPRINT"] },
    }),
  ],
});

StringArray.test("Typing a new value adds it as a chip", async ({ canvas }) => {
  const input = canvas.getByRole("combobox");

  await userEvent.click(input);
  await userEvent.type(input, "HDR{enter}");

  await expect(canvas.getByText("HDR")).toBeInTheDocument();
});

StringArray.test(
  "Clicking the remove button removes a chip",
  async ({ canvas }) => {
    const chip = canvas.getByText("CAM").closest('[data-slot="combobox-chip"]');

    await expect(chip).not.toBeNull();

    const removeButton = within(chip as HTMLElement).getByRole("button");

    await userEvent.click(removeButton);

    await expect(canvas.queryByText("CAM")).not.toBeInTheDocument();
  },
);

export const CustomRank = meta.story({
  args: {
    type: "custom_rank",
    config: {
      label: "1080p",
      name: "custom-rank",
      description: "Custom rank for the 1080p resolution",
    },
  },
  decorators: [
    createFormDecorator({
      progressive: true,
      defaultValues: { "custom-rank": { fetch: true, rank: 1 } },
    }),
  ],
});

CustomRank.test(
  "Toggling fetch disables and enables the rank input",
  async ({ canvas, step }) => {
    const fetchSwitch = canvas.getByRole("switch", { name: /fetch/iu });
    const rankInput = canvas.getByRole("spinbutton");

    await step("Enabled by default", async () => {
      await expect(fetchSwitch).toBeChecked();
      await expect(rankInput).toBeEnabled();
    });

    await step("Disables the rank input when fetch is off", async () => {
      await userEvent.click(fetchSwitch);
      await expect(fetchSwitch).not.toBeChecked();
      await expect(rankInput).toBeDisabled();
    });

    await step("Re-enables the rank input when fetch is on", async () => {
      await userEvent.click(fetchSwitch);
      await expect(fetchSwitch).toBeChecked();
      await expect(rankInput).toBeEnabled();
    });
  },
);

export const Dictionary = meta.story({
  args: {
    type: "dictionary",
    config: {
      label: "Dictionary",
      name: "dictionary",
      keyLabel: "Profile key",
      addLabel: "Add profile",
      itemFields: [
        {
          type: "boolean",
          config: {
            label: "Enabled",
            name: "enabled",
          },
        },
      ],
    },
  },
  decorators: [
    createFormDecorator({
      progressive: true,
      defaultValues: {
        dictionary: [
          {
            key: "anime_profile",
            enabled: true,
          },
          {
            key: "profile_key_2",
            enabled: true,
          },
          {
            key: "profile_key_3",
            enabled: true,
          },
          {
            key: "profile_key_4",
            enabled: false,
          },
          {
            key: "profile_key_5",
            enabled: false,
          },
        ],
      },
    }),
  ],
});

Dictionary.test(
  "Typing in a key input updates its value",
  async ({ canvas }) => {
    const [firstKeyInput] = canvas.getAllByRole("textbox", {
      name: /profile key/iu,
    });

    expect.assert(firstKeyInput);

    await userEvent.clear(firstKeyInput);
    await userEvent.type(firstKeyInput, "new_profile_key");

    await expect(firstKeyInput).toHaveValue("new_profile_key");
  },
);

Dictionary.test(
  "Toggling an entry's enabled switch updates it",
  async ({ canvas }) => {
    const [firstSwitch] = canvas.getAllByRole("switch", {
      name: /enabled/iu,
    });

    expect.assert(firstSwitch);

    await expect(firstSwitch).toBeChecked();

    await userEvent.click(firstSwitch);

    await expect(firstSwitch).not.toBeChecked();
  },
);

Dictionary.test(
  "Clicking add profile appends a new entry",
  async ({ canvas }) => {
    const keyInputsBefore = canvas.getAllByRole("textbox", {
      name: /profile key/iu,
    });

    await expect(keyInputsBefore).toHaveLength(5);

    await userEvent.click(
      canvas.getByRole("button", { name: /add profile/iu }),
    );

    const keyInputsAfter = canvas.getAllByRole("textbox", {
      name: /profile key/iu,
    });

    await expect(keyInputsAfter).toHaveLength(6);
  },
);

Dictionary.test(
  "Clicking the trash button removes that entry",
  async ({ canvas }) => {
    const animeProfileInput = canvas.getByDisplayValue("anime_profile");

    await expect(animeProfileInput).toBeInTheDocument();

    const removeButton = canvas.getByRole("button", {
      name: /remove anime_profile/iu,
    });

    await userEvent.click(removeButton);

    await expect(
      canvas.queryByDisplayValue("anime_profile"),
    ).not.toBeInTheDocument();
  },
);

export const SettingGroup = meta.story({
  args: {
    type: "group",
    config: {
      name: "My Setting Group",
      schema: [
        {
          type: "text",
          config: {
            name: "setting1",
            label: "Setting 1",
          },
        },
        {
          type: "boolean",
          config: {
            name: "setting2",
            label: "Setting 2",
          },
        },
      ],
    },
  },
  decorators: [
    createFormDecorator({
      defaultValues: {
        setting1: "Setting 1 value",
        setting2: true,
      },
    }),
  ],
});
