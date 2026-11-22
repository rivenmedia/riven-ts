import { expect, fn, mocked, userEvent, waitFor, within } from "storybook/test";
import { z } from "zod";

import { preview } from "#.storybook/preview.tsx";

import { SchemaSettingsForm } from "./schema-settings-form";

import type { SchemaSettingsFormProps } from "./schema-settings-form";

const onSubmit = fn<SchemaSettingsFormProps["onSubmit"]>();

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
    onSubmit,
  },
  beforeEach() {
    onSubmit.mockReset();
  },
});

export const Default = meta.story();

Default.test(
  "Hands over the submission and starts clean once it's saved",
  async ({ canvas }) => {
    onSubmit.mockResolvedValue({ saved: true });

    const name = canvas.getByRole("textbox", { name: "Name" });
    const saveButton = canvas.getByRole("button", { name: "Save profile" });

    await userEvent.clear(name);
    await userEvent.type(name, "4K");
    await userEvent.click(canvas.getByRole("switch", { name: "Fetch" }));
    await userEvent.type(canvas.getByRole("spinbutton"), "750");
    await userEvent.click(saveButton);

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        values: { name: "4K", quality: { av1: { fetch: true, rank: 750 } } },
        reset: [],
      }),
    );
    await waitFor(() => expect(saveButton).toBeDisabled());
    await expect(name).toHaveValue("4K");
  },
);

Default.test("Shows the issues of a refused submission", async ({ canvas }) => {
  onSubmit.mockResolvedValue({
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
});

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
};

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
        excludedWords: z.array(z.string()).meta({ title: "Excluded words" }),
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
    onSubmit: fn<SchemaSettingsFormProps["onSubmit"]>(),
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
    mocked(args.onSubmit).mockResolvedValue({ saved: true });

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
    mocked(args.onSubmit).mockResolvedValue({ saved: true });

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
    mocked(args.onSubmit).mockResolvedValue({ saved: true });

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
    mocked(args.onSubmit).mockResolvedValue({ saved: true });

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
    mocked(args.onSubmit).mockResolvedValue({ saved: true });

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
    mocked(args.onSubmit).mockResolvedValue({ saved: true });

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
  "Saves an edited tuple item with the others",
  async ({ args, canvas }) => {
    mocked(args.onSubmit).mockResolvedValue({ saved: true });

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
    mocked(args.onSubmit).mockResolvedValue({ saved: true });

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
