import { useState } from "react";
import { expect, fn, mocked, userEvent, waitFor, within } from "storybook/test";
import { z } from "zod";

import { preview } from "#.storybook/preview.tsx";

import { SchemaSettingsForm } from "./schema-settings-form";

import type { SchemaSettingsFormProps } from "./schema-settings-form";

const meta = preview.meta({
  title: "Settings / SchemaSettingsForm",
  component: SchemaSettingsForm,
  args: {
    title: "Profile",
    jsonSchema: z.toJSONSchema(
      z.object({
        name: z.string().min(1).meta({ title: "Name" }),
        quality: z
          .strictObject({
            av1: z
              .strictObject({ fetch: z.boolean(), rank: z.int().optional() })
              .meta({ widget: "custom_rank", title: "AV1" }),
          })
          .meta({ title: "Quality" }),
      }),
      { io: "input" },
    ),
    values: { name: "Mine", quality: { av1: { fetch: false } } },
    lockedFields: [],
    secretStates: [],
    issues: [],
    submitLabel: "Save profile",
    isPending: false,
    onSubmit: fn<SchemaSettingsFormProps["onSubmit"]>(),
  },
});

export const Default = meta.story();

Default.test(
  "Hands over the submission and starts clean once it's saved",
  async ({ args, canvas }) => {
    mocked(args.onSubmit).mockResolvedValue({ saved: true });

    const name = canvas.getByRole("textbox", { name: "Name" });
    const saveButton = canvas.getByRole("button", { name: "Save profile" });

    await userEvent.clear(name);
    await userEvent.type(name, "4K");
    await userEvent.click(canvas.getByRole("switch", { name: "Fetch" }));
    await userEvent.type(canvas.getByRole("spinbutton"), "750");
    await userEvent.click(saveButton);

    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith({
        values: { name: "4K", quality: { av1: { fetch: true, rank: 750 } } },
        reset: [],
      }),
    );
    await waitFor(() => expect(saveButton).toBeDisabled());
    await expect(name).toHaveValue("4K");
  },
);

Default.test(
  "Shows the issues of a refused submission",
  async ({ args, canvas }) => {
    mocked(args.onSubmit).mockResolvedValue({
      saved: false,
      issues: [
        { path: "name", message: "A profile with this name already exists." },
        { path: "", message: "The profile could not be saved." },
      ],
    });

    await userEvent.type(canvas.getByRole("textbox", { name: "Name" }), "2");
    await userEvent.click(canvas.getByRole("button", { name: "Save profile" }));

    await expect(
      await canvas.findByText("A profile with this name already exists."),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("The profile could not be saved."),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Save profile" }),
    ).toBeEnabled();
  },
);

export const Pending = meta.story({ args: { isPending: true } });

Pending.test("Can't submit whilst pending", async ({ canvas }) => {
  await userEvent.type(canvas.getByRole("textbox", { name: "Name" }), "2");

  await expect(
    canvas.getByRole("button", { name: "Save profile" }),
  ).toBeDisabled();
});

const everySettingValues = {
  instanceName: "Riven",
  port: 8080,
  enabled: true,
  dubbedOnly: null,
  resolution: "1080p",
  excludedWords: ["CAM"],
  retrySchedule: [2, 6],
  av1: { fetch: true, rank: 500 },
} as const;

/** A form with a setting of every type that can be rendered. */
export const EverySettingType = meta.story({
  args: {
    title: "Settings",
    jsonSchema: z.toJSONSchema(
      z.object({
        instanceName: z.string().meta({ title: "Instance name" }),
        port: z.int().optional().meta({ title: "Port" }),
        enabled: z.boolean().meta({ title: "Enabled" }),
        dubbedOnly: z.boolean().nullable().meta({ title: "Dubbed only" }),
        resolution: z.enum(["2160p", "1080p"]).meta({ title: "Resolution" }),
        excludedWords: z
          .array(z.string())
          .max(2)
          .meta({ title: "Excluded words" }),
        retrySchedule: z
          .tuple([z.int(), z.int()])
          .meta({ title: "Retry schedule" }),
        av1: z
          .strictObject({ fetch: z.boolean(), rank: z.int().optional() })
          .meta({ widget: "custom_rank", title: "AV1" }),
      }),
      { io: "input" },
    ),
    values: everySettingValues,
    submitLabel: "Save",
  },
  beforeEach({ args }) {
    mocked(args.onSubmit).mockResolvedValue({ saved: true });
  },
});

/** Saves the dirtied form, and expects the edited values to be submitted. */
async function expectToSave(
  saveButton: HTMLElement,
  onSubmitSpy: SchemaSettingsFormProps["onSubmit"],
  editedValues: Record<string, unknown>,
) {
  await expect(saveButton).toBeEnabled();

  await userEvent.click(saveButton);

  await waitFor(() =>
    expect(onSubmitSpy).toHaveBeenCalledWith({
      values: { ...everySettingValues, ...editedValues },
      reset: [],
    }),
  );
}

EverySettingType.test("Starts clean", async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled();
});

EverySettingType.test(
  "Saves an edited text setting",
  async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Instance name" });

    await userEvent.clear(input);
    await userEvent.type(input, "Riven 2");

    await expectToSave(
      canvas.getByRole("button", { name: "Save" }),
      args.onSubmit,
      { instanceName: "Riven 2" },
    );
  },
);

EverySettingType.test(
  "Saves an edited number setting as a number",
  async ({ args, canvas }) => {
    const input = canvas.getByRole("spinbutton", { name: "Port" });

    await userEvent.clear(input);
    await userEvent.type(input, "9090");

    await expectToSave(
      canvas.getByRole("button", { name: "Save" }),
      args.onSubmit,
      { port: 9090 },
    );
  },
);

EverySettingType.test(
  "Saves a toggled boolean setting",
  async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("switch", { name: "Enabled" }));

    await expectToSave(
      canvas.getByRole("button", { name: "Save" }),
      args.onSubmit,
      { enabled: false },
    );
  },
);

EverySettingType.test(
  "Saves a chosen nullable boolean setting",
  async ({ args, canvas, canvasElement }) => {
    await userEvent.click(
      canvas.getByRole("combobox", { name: "Dubbed only" }),
    );
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("option", {
        name: "Yes",
      }),
    );

    await expectToSave(
      canvas.getByRole("button", { name: "Save" }),
      args.onSubmit,
      { dubbedOnly: true },
    );
  },
);

EverySettingType.test(
  "Saves a chosen select setting",
  async ({ args, canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Resolution" }));
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("option", {
        name: "2160p",
      }),
    );

    await expectToSave(
      canvas.getByRole("button", { name: "Save" }),
      args.onSubmit,
      { resolution: "2160p" },
    );
  },
);

EverySettingType.test(
  "Saves an added string array item",
  async ({ args, canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Excluded words" });

    await userEvent.click(input);
    await userEvent.type(input, "HDR{enter}");

    await expectToSave(
      canvas.getByRole("button", { name: "Save" }),
      args.onSubmit,
      { excludedWords: ["CAM", "HDR"] },
    );
  },
);

EverySettingType.test(
  "Focuses an invalid string array setting instead of saving",
  async ({ args, canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Excluded words" });

    await userEvent.click(input);
    await userEvent.type(input, "HDR{enter}");
    await userEvent.type(input, "TS{enter}");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(input).toHaveFocus());
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
);

EverySettingType.test(
  "Saves an edited tuple item with the others",
  async ({ args, canvas }) => {
    const input = canvas.getByRole("spinbutton", { name: "Retry schedule 2" });

    await userEvent.clear(input);
    await userEvent.type(input, "7");

    await expectToSave(
      canvas.getByRole("button", { name: "Save" }),
      args.onSubmit,
      { retrySchedule: [2, 7] },
    );
  },
);

EverySettingType.test(
  "Saves a rank's toggled fetch without its rank",
  async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("switch", { name: "Fetch" }));

    await expect(
      canvas.getByRole("spinbutton", { name: "AV1 rank" }),
    ).toBeDisabled();

    await expectToSave(
      canvas.getByRole("button", { name: "Save" }),
      args.onSubmit,
      { av1: { fetch: false } },
    );
  },
);

/** Re-renders the form with new but equal stored values once it's saved, as revalidating the page does. */
function RevalidatingSchemaSettingsForm(props: SchemaSettingsFormProps) {
  const [values, setValues] = useState(props.values);

  return (
    <SchemaSettingsForm
      {...props}
      values={values}
      onSubmit={async (submission) => {
        const result = await props.onSubmit(submission);

        // A reset setting whose stored value was its default keeps it
        setValues(structuredClone(props.values));

        return result;
      }}
    />
  );
}

export const WithRevalidation = EverySettingType.extend({
  args: {
    issues: [{ path: "instanceName", message: "Instance name is taken." }],
  },
  render: (args) => <RevalidatingSchemaSettingsForm {...args} />,
});

WithRevalidation.test(
  "Shows the stored value of a reset setting once it's saved",
  async ({ args, canvas }) => {
    const port = canvas.getByRole("spinbutton", { name: "Port" });

    await userEvent.clear(port);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith({
        values: { ...everySettingValues, port: undefined },
        reset: ["port"],
      }),
    );
    await waitFor(() => expect(port).toHaveValue(8080));
    await expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled();
  },
);

WithRevalidation.test(
  "Shows the issues with the stored values again once it's saved",
  async ({ args, canvas }) => {
    await expect(
      canvas.getByText("Instance name is taken."),
    ).toBeInTheDocument();

    const port = canvas.getByRole("spinbutton", { name: "Port" });

    await userEvent.clear(port);
    await userEvent.type(port, "9090");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(args.onSubmit).toHaveBeenCalled());
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled(),
    );
    await expect(
      canvas.getByText("Instance name is taken."),
    ).toBeInTheDocument();
  },
);
