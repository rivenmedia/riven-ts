import { expect, fn, userEvent, waitFor, within } from "storybook/test";
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

export const StringArray = meta.story({
  args: {
    title: "Filters",
    jsonSchema: z.toJSONSchema(
      z.object({
        excludedWords: z.array(z.string()).meta({ title: "Excluded Words" }),
      }),
      { io: "input" },
    ),
    values: { excludedWords: ["CAM", "TS"] },
    submitLabel: "Save filters",
  },
});

StringArray.test(
  "Editing the chips enables saving",
  async ({ canvas, step }) => {
    const saveButton = canvas.getByRole("button", { name: "Save filters" });

    await step("Can't save until something changes", async () => {
      await expect(saveButton).toBeDisabled();
    });

    await step("Adding a chip enables saving", async () => {
      const input = canvas.getByRole("combobox");

      await userEvent.click(input);
      await userEvent.type(input, "HDR{enter}");

      await expect(saveButton).toBeEnabled();
    });
  },
);

export const BooleanSwitch = meta.story({
  args: {
    title: "Library",
    jsonSchema: z.toJSONSchema(
      z.object({ autoScan: z.boolean().meta({ title: "Auto Scan" }) }),
      { io: "input" },
    ),
    values: { autoScan: false },
    submitLabel: "Save library",
  },
});

BooleanSwitch.test(
  "Toggling the switch enables saving",
  async ({ canvas, step }) => {
    const saveButton = canvas.getByRole("button", { name: "Save library" });

    await step("Can't save until something changes", async () => {
      await expect(saveButton).toBeDisabled();
    });

    await step("Toggling the switch enables saving", async () => {
      await userEvent.click(canvas.getByRole("switch", { name: "Auto Scan" }));

      await expect(saveButton).toBeEnabled();
    });
  },
);

export const Select = meta.story({
  args: {
    title: "Playback",
    jsonSchema: z.toJSONSchema(
      z.object({
        resolution: z.enum(["480p", "720p", "1080p"]).meta({
          title: "Resolution",
        }),
      }),
      { io: "input" },
    ),
    values: { resolution: "1080p" },
    submitLabel: "Save playback",
  },
});

Select.test(
  "Choosing an option enables saving",
  async ({ canvas, canvasElement, step }) => {
    const saveButton = canvas.getByRole("button", { name: "Save playback" });

    await step("Can't save until something changes", async () => {
      await expect(saveButton).toBeDisabled();
    });

    await step("Choosing an option enables saving", async () => {
      await userEvent.click(canvas.getByRole("combobox"));
      await userEvent.click(
        await within(canvasElement.ownerDocument.body).findByRole("option", {
          name: "720p",
        }),
      );

      await expect(saveButton).toBeEnabled();
    });
  },
);
