import { delay, HttpResponse } from "msw";
import { useEffect, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { z } from "zod";

import { preview } from "#.storybook/preview.tsx";
import { api } from "#mocks/graphql.ts";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";

import { RESET_SETTINGS_FIELDS } from "./_mutations/reset-settings-fields.mutation";
import { UPDATE_SETTINGS_SECTION } from "./_mutations/update-settings-section.mutation";
import { SettingsSectionForm } from "./settings-section-form";

import type { ResetSettingsFieldsMutation } from "./_mutations/reset-settings-fields.mutation.typegen";
import type {
  UpdateSettingsSectionMutation,
  UpdateSettingsSectionMutationVariables,
} from "./_mutations/update-settings-section.mutation.typegen";
import type { SettingsSectionFormProps } from "./settings-section-form";

/** Serves a Zod schema the way the backend does. */
const toServedJsonSchema = (schema: z.ZodObject) =>
  z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;

const generalJsonSchema = toServedJsonSchema(
  z.object({
    scraping: z
      .object({
        dubbedAnimeOnly: z.boolean().default(false).meta({
          title: "Dubbed Anime Only",
          description: "Only scrape dubbed anime.",
        }),
        maximumFailedAttempts: z.int().nonnegative().max(10).default(10).meta({
          title: "Maximum Failed Attempts",
          description:
            "The maximum number of scrape attempts before giving up on an item.",
        }),
        // Optional with no default, so it has no stored value
        minimumAverageBitrateMovies: z.int().positive().optional().meta({
          title: "Minimum Average Bitrate (Movies)",
        }),
      })
      .meta({ title: "Scraping" }),
    logging: z
      .object({
        logDirectory: z.string().default("./logs").meta({
          title: "Log Directory",
          description: "The directory where log files will be stored.",
        }),
      })
      .meta({ title: "Logging" }),
  }),
);

const generalValues = {
  scraping: { dubbedAnimeOnly: false, maximumFailedAttempts: 10 },
  logging: { logDirectory: "./logs" },
};

const updateSettingsSectionRequest =
  fn<(variables: UpdateSettingsSectionMutationVariables) => void>();

const resetSettingsFieldsRequest = fn();

const meta = preview.meta({
  title: "Settings / SettingsSectionForm",
  component: SettingsSectionForm,
  args: {
    id: "general",
    title: "General",
    jsonSchema: generalJsonSchema,
    values: generalValues,
    lockedFields: [],
    secretStates: [],
    issues: [],
  },
  beforeEach({ msw }) {
    updateSettingsSectionRequest.mockClear();
    resetSettingsFieldsRequest.mockClear();

    msw.use(
      createHasPermissionHandler({ instance: ["manage-settings"] }),
      api.mutation(UPDATE_SETTINGS_SECTION, ({ variables }) => {
        updateSettingsSectionRequest(variables);

        return HttpResponse.json({
          data: {
            updateSettingsSection: {
              __typename: "SettingsMutationResult",
              success: true,
              issues: [],
            },
          } satisfies UpdateSettingsSectionMutation,
        });
      }),
      api.mutation(RESET_SETTINGS_FIELDS, ({ variables }) => {
        resetSettingsFieldsRequest(variables);

        return HttpResponse.json({
          data: {
            resetSettingsFields: {
              __typename: "SettingsMutationResult",
              success: true,
              issues: [],
            },
          } satisfies ResetSettingsFieldsMutation,
        });
      }),
    );
  },
});

const getLastSubmittedValues = () =>
  updateSettingsSectionRequest.mock.lastCall?.[0].values;

const getLastResetFields = () =>
  updateSettingsSectionRequest.mock.lastCall?.[0].reset;

export const Default = meta.story();

Default.test("Saves the changed values", async ({ canvas, step }) => {
  const saveButton = canvas.getByRole("button", { name: "Save" });

  await step("Save is disabled until a value changes", async () => {
    await expect(saveButton).toBeDisabled();
  });

  await step("Submits the form's values", async () => {
    const logDirectory = canvas.getByRole("textbox", {
      name: "Log Directory",
    });

    await userEvent.clear(logDirectory);
    await userEvent.type(logDirectory, "/var/log/riven");
    await userEvent.click(saveButton);

    await waitFor(() =>
      expect(updateSettingsSectionRequest).toHaveBeenCalledWith({
        id: "general",
        values: {
          scraping: { dubbedAnimeOnly: false, maximumFailedAttempts: 10 },
          logging: { logDirectory: "/var/log/riven" },
        },
        reset: [],
      }),
    );
  });

  await step("Leaves out an optional number that has no value", async () => {
    await expect(getLastSubmittedValues()).not.toHaveProperty(
      "scraping.minimumAverageBitrateMovies",
    );
    await expect(getLastResetFields()).toStrictEqual([]);
  });

  await step("Tells the user to restart Riven", async () => {
    await expect(
      await canvas.findByText("Settings saved. Restart Riven to apply them."),
    ).toBeInTheDocument();
  });

  await step("Starts clean from the saved values", async () => {
    await expect(saveButton).toBeDisabled();
    await expect(
      canvas.getByRole("textbox", { name: "Log Directory" }),
    ).toHaveValue("/var/log/riven");
  });
});

Default.test(
  "Submits a typed optional number as a number",
  async ({ canvas }) => {
    const minimumAverageBitrate = canvas.getByRole("spinbutton", {
      name: "Minimum Average Bitrate (Movies)",
    });

    await expect(minimumAverageBitrate).toHaveValue(null);

    await userEvent.type(minimumAverageBitrate, "2500");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(getLastSubmittedValues()).toStrictEqual({
        scraping: {
          dubbedAnimeOnly: false,
          maximumFailedAttempts: 10,
          minimumAverageBitrateMovies: 2500,
        },
        logging: { logDirectory: "./logs" },
      }),
    );
  },
);

Default.test(
  "Shows backend issues returned on save against their fields",
  async ({ canvas, msw }) => {
    msw.use(
      api.mutation(UPDATE_SETTINGS_SECTION, () =>
        HttpResponse.json({
          data: {
            updateSettingsSection: {
              __typename: "SettingsMutationResult",
              success: false,
              issues: [
                {
                  __typename: "SettingsIssue",
                  path: "logging.logDirectory",
                  message: "Directory is not writable",
                },
              ],
            },
          } satisfies UpdateSettingsSectionMutation,
        }),
      ),
    );

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Log Directory" }),
      "/root",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await expect(
      await canvas.findByText("Directory is not writable"),
    ).toBeInTheDocument();
  },
);

Default.test(
  "Shows backend issues returned on save that have no field",
  async ({ canvas, msw }) => {
    msw.use(
      api.mutation(UPDATE_SETTINGS_SECTION, () =>
        HttpResponse.json({
          data: {
            updateSettingsSection: {
              __typename: "SettingsMutationResult",
              success: false,
              issues: [
                {
                  __typename: "SettingsIssue",
                  path: "",
                  message: "Settings could not be saved",
                },
                {
                  __typename: "SettingsIssue",
                  path: "scraping.removedSetting",
                  message: "Unrecognised setting",
                },
              ],
            },
          } satisfies UpdateSettingsSectionMutation,
        }),
      ),
    );

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Log Directory" }),
      "/root",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await expect(
      await canvas.findByText("Settings could not be saved"),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByText("scraping.removedSetting: Unrecognised setting"),
    ).toBeInTheDocument();
  },
);

export const WithIssues = meta.story({
  args: {
    issues: [
      {
        path: "scraping.maximumFailedAttempts",
        message: "Too big: expected number to be <=10",
      },
    ],
  },
});

WithIssues.test(
  "Shows stored value issues before any submit",
  async ({ canvas }) => {
    await expect(
      await canvas.findByText("Too big: expected number to be <=10"),
    ).toBeInTheDocument();
  },
);

export const WithSectionIssues = meta.story({
  args: {
    issues: [
      { path: "", message: "Stored settings are invalid" },
      { path: "scraping.removedSetting", message: "Unrecognised setting" },
    ],
  },
});

WithSectionIssues.test(
  "Shows stored issues that have no field before any submit",
  async ({ canvas }) => {
    await expect(
      await canvas.findByText("Stored settings are invalid"),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByText("scraping.removedSetting: Unrecognised setting"),
    ).toBeInTheDocument();
  },
);

export const WithCustomSecret = meta.story({
  args: {
    id: "repo-plugin-comet",
    title: "Comet",
    // A secret with a value is served as optional, and its value is never sent
    jsonSchema: toServedJsonSchema(
      z.object({
        url: z.url().default("https://comet.example.com").meta({
          title: "URL",
        }),
        apiKey: z.string().optional().meta({ title: "API Key", secret: true }),
      }),
    ),
    values: { url: "https://comet.example.com" },
    secretStates: [{ path: "apiKey", state: "custom" }],
  },
});

WithCustomSecret.test(
  "Submits a blank secret, which leaves it unchanged",
  async ({ canvas }) => {
    await expect(canvas.getByLabelText("API Key")).toHaveAttribute(
      "placeholder",
      "Custom value set — type to replace",
    );

    const url = canvas.getByRole("textbox", { name: "URL" });

    await userEvent.clear(url);
    await userEvent.type(url, "https://comet.local");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(getLastSubmittedValues()).toStrictEqual({
        url: "https://comet.local",
        apiKey: "",
      }),
    );
  },
);

WithCustomSecret.test(
  "Resets the secret to its default",
  async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));

    const dialog = within(await body.findByRole("alertdialog"));

    await userEvent.click(dialog.getByRole("button", { name: "Reset" }));

    await waitFor(() =>
      expect(resetSettingsFieldsRequest).toHaveBeenCalledWith({
        id: "repo-plugin-comet",
        paths: ["apiKey"],
      }),
    );
  },
);

WithCustomSecret.test(
  "Shows the backend issue when a reset fails",
  async ({ canvas, canvasElement, msw }) => {
    msw.use(
      api.mutation(RESET_SETTINGS_FIELDS, () =>
        HttpResponse.json({
          data: {
            resetSettingsFields: {
              __typename: "SettingsMutationResult",
              success: false,
              issues: [
                {
                  __typename: "SettingsIssue",
                  path: "apiKey",
                  message: "API Key has no default to reset to",
                },
              ],
            },
          } satisfies ResetSettingsFieldsMutation,
        }),
      ),
    );

    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await userEvent.click(
      within(await body.findByRole("alertdialog")).getByRole("button", {
        name: "Reset",
      }),
    );

    await expect(
      await canvas.findByText("apiKey: API Key has no default to reset to"),
    ).toBeInTheDocument();
  },
);

WithCustomSecret.test(
  "Blanks the typed secret after saving",
  async ({ canvas }) => {
    const apiKey = canvas.getByLabelText("API Key");

    await userEvent.type(apiKey, "new-api-key");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(getLastSubmittedValues()).toStrictEqual({
        url: "https://comet.example.com",
        apiKey: "new-api-key",
      }),
    );
    await waitFor(() => expect(apiKey).toHaveValue(""));
    await expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled();
  },
);

/** Re-renders the form with new stored values, as a revalidation of the page does. */
function RevalidatingForm(props: SettingsSectionFormProps) {
  const [values, setValues] = useState(props.values);

  return (
    <>
      <SettingsSectionForm {...props} values={values} />
      <button
        type="button"
        onClick={() => {
          setValues({
            scraping: { dubbedAnimeOnly: false, maximumFailedAttempts: 7 },
            logging: { logDirectory: "./logs" },
          });
        }}
      >
        Revalidate
      </button>
    </>
  );
}

export const WithRevalidation = meta.story({
  render: (args) => <RevalidatingForm {...args} />,
});

WithRevalidation.test(
  "Keeps unsaved edits when the stored values change",
  async ({ canvas }) => {
    const logDirectory = canvas.getByRole("textbox", { name: "Log Directory" });

    await userEvent.clear(logDirectory);
    await userEvent.type(logDirectory, "/var/log/riven");
    await userEvent.click(canvas.getByRole("button", { name: "Revalidate" }));

    await waitFor(() =>
      expect(
        canvas.getByRole("spinbutton", { name: "Maximum Failed Attempts" }),
      ).toHaveValue(7),
    );
    await expect(logDirectory).toHaveValue("/var/log/riven");
    await expect(canvas.getByRole("button", { name: "Save" })).toBeEnabled();
  },
);

export const WithLockedField = meta.story({
  args: {
    lockedFields: ["logging.logDirectory"],
  },
});

WithLockedField.test(
  "Disables the locked field and still saves it",
  async ({ canvas }) => {
    await expect(
      canvas.getByRole("textbox", { name: "Log Directory" }),
    ).toBeDisabled();
    await expect(
      canvas.getByText("Set by environment variable"),
    ).toBeInTheDocument();

    const maximumFailedAttempts = canvas.getByRole("spinbutton", {
      name: "Maximum Failed Attempts",
    });

    await userEvent.clear(maximumFailedAttempts);
    await userEvent.type(maximumFailedAttempts, "5");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await expect(
      await canvas.findByText("Settings saved. Restart Riven to apply them."),
    ).toBeInTheDocument();
    await expect(getLastSubmittedValues()).toStrictEqual({
      scraping: { dubbedAnimeOnly: false, maximumFailedAttempts: 5 },
      logging: { logDirectory: "./logs" },
    });
  },
);

export const WithUnsupportedField = meta.story({
  args: {
    jsonSchema: toServedJsonSchema(
      z.object({
        logDirectory: z.string().default("./logs").meta({
          title: "Log Directory",
        }),
        retention: z
          .union([z.int(), z.string()])
          .optional()
          .meta({ title: "Retention" }),
        notificationUrls: z
          .array(z.union([z.url(), z.email()]))
          .optional()
          .meta({ title: "Notification URLs" }),
      }),
    ),
    values: {
      logDirectory: "./logs",
      retention: "7d",
      notificationUrls: ["https://example.com/hook"],
    },
  },
});

WithUnsupportedField.test(
  "Skips the unsupported fields when rendering and saving",
  async ({ canvas }) => {
    await expect(canvas.queryByText("Retention")).not.toBeInTheDocument();
    await expect(
      canvas.queryByText("Notification URLs"),
    ).not.toBeInTheDocument();

    const logDirectory = canvas.getByRole("textbox", {
      name: "Log Directory",
    });

    await userEvent.clear(logDirectory);
    await userEvent.type(logDirectory, "/var/log/riven");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(getLastSubmittedValues()).toStrictEqual({
        logDirectory: "/var/log/riven",
      }),
    );
  },
);

export const WithTuple = meta.story({
  args: {
    jsonSchema: toServedJsonSchema(
      z.object({
        logDirectory: z.string().default("./logs").meta({
          title: "Log Directory",
        }),
        scrapeCooldownHours: z
          .tuple([
            z.int().nonnegative().default(2),
            z.int().nonnegative().default(6),
            z.int().nonnegative().default(24),
          ])
          .default([2, 6, 24])
          .meta({ title: "Scrape Cooldown Hours" }),
      }),
    ),
    values: { logDirectory: "./logs", scrapeCooldownHours: [2, 6, 24] },
  },
});

WithTuple.test(
  "Renders a number input per tuple item and submits them in order",
  async ({ canvas }) => {
    const inputs = canvas.getAllByRole("spinbutton");

    await expect(inputs).toHaveLength(3);
    await expect(
      inputs.map((input) => (input as HTMLInputElement).value),
    ).toStrictEqual(["2", "6", "24"]);

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Log Directory" }),
      "/riven",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(getLastSubmittedValues()).toStrictEqual({
        logDirectory: "./logs/riven",
        scrapeCooldownHours: [2, 6, 24],
      }),
    );
  },
);

const clearableJsonSchema = toServedJsonSchema(
  z.object({
    url: z.string().min(1).meta({ title: "URL" }),
    limit: z.int().positive().optional().meta({ title: "Limit" }),
    minimumBitrate: z
      .int()
      .positive()
      .optional()
      .meta({ title: "Minimum Bitrate" }),
    retries: z.int().nonnegative().default(3).meta({ title: "Retries" }),
    // `null` disables updates
    updateIntervalSeconds: z
      .int()
      .nonnegative()
      .nullable()
      .default(60)
      .meta({ title: "Update Interval" }),
  }),
);

const clearableValues = {
  url: "https://example.com",
  limit: 5,
  retries: 7,
  updateIntervalSeconds: 120,
};

/** The stored values once `retries` has been reset to its default. */
const resetRetriesValues = { ...clearableValues, retries: 3 };

const clearableArgs = {
  id: "repo-plugin-clearable",
  title: "Clearable",
  jsonSchema: clearableJsonSchema,
  values: clearableValues,
};

export const WithClearableFields = meta.story({ args: clearableArgs });

WithClearableFields.test(
  "Resets an emptied optional number with no default",
  async ({ canvas }) => {
    await userEvent.clear(canvas.getByRole("spinbutton", { name: "Limit" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateSettingsSectionRequest).toHaveBeenCalledWith({
        id: "repo-plugin-clearable",
        values: {
          url: "https://example.com",
          retries: 7,
          updateIntervalSeconds: 120,
        },
        reset: ["limit"],
      }),
    );
  },
);

WithClearableFields.test(
  "Resets an emptied field that has a default",
  async ({ canvas }) => {
    await userEvent.clear(canvas.getByRole("spinbutton", { name: "Retries" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(getLastResetFields()).toStrictEqual(["retries"]),
    );
    await expect(getLastSubmittedValues()).not.toHaveProperty("retries");
  },
);

WithClearableFields.test(
  "Saves an emptied nullable number as null",
  async ({ canvas }) => {
    await userEvent.clear(
      canvas.getByRole("spinbutton", { name: "Update Interval" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(getLastSubmittedValues()).toStrictEqual({
        url: "https://example.com",
        limit: 5,
        retries: 7,
        updateIntervalSeconds: null,
      }),
    );
    await expect(getLastResetFields()).toStrictEqual([]);
  },
);

WithClearableFields.test(
  "Refuses to save an emptied required field",
  async ({ canvas }) => {
    await userEvent.clear(canvas.getByRole("textbox", { name: "URL" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await expect(
      await canvas.findByText(/expected string, received undefined/u),
    ).toBeInTheDocument();
    await expect(updateSettingsSectionRequest).not.toHaveBeenCalled();
  },
);

WithClearableFields.test(
  "Neither saves nor resets an untouched field with no value",
  async ({ canvas }) => {
    const limit = canvas.getByRole("spinbutton", { name: "Limit" });

    await userEvent.clear(limit);
    await userEvent.type(limit, "6");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(getLastSubmittedValues()).toStrictEqual({
        url: "https://example.com",
        limit: 6,
        retries: 7,
        updateIntervalSeconds: 120,
      }),
    );
    await expect(getLastResetFields()).toStrictEqual([]);
  },
);

/** Updates the form's stored values, as revalidating the page does. */
let revalidateClearableForm: ((values: typeof clearableValues) => void) | null =
  null;

/** Re-renders the form with the stored values it's revalidated with. */
function RevalidatingClearableForm(props: SettingsSectionFormProps) {
  const [values, setValues] = useState(props.values);

  useEffect(() => {
    revalidateClearableForm = setValues;

    return () => {
      revalidateClearableForm = null;
    };
  }, []);

  return (
    <>
      <SettingsSectionForm {...props} values={values} />
      <button
        type="button"
        onClick={() => {
          setValues(resetRetriesValues);
        }}
      >
        Revalidate
      </button>
    </>
  );
}

export const WithClearedFieldRevalidation = meta.story({
  args: clearableArgs,
  render: (args) => <RevalidatingClearableForm {...args} />,
});

WithClearedFieldRevalidation.test(
  "Shows the default of a reset field when the page revalidates during the save",
  async ({ canvas, msw }) => {
    msw.use(
      api.mutation(UPDATE_SETTINGS_SECTION, async () => {
        revalidateClearableForm?.(resetRetriesValues);

        // Lets the revalidated values render before the save succeeds
        await delay(100);

        return HttpResponse.json({
          data: {
            updateSettingsSection: {
              __typename: "SettingsMutationResult",
              success: true,
              issues: [],
            },
          } satisfies UpdateSettingsSectionMutation,
        });
      }),
    );

    const retries = canvas.getByRole("spinbutton", { name: "Retries" });

    await userEvent.clear(retries);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await expect(
      await canvas.findByText("Settings saved. Restart Riven to apply them."),
    ).toBeInTheDocument();
    await waitFor(() => expect(retries).toHaveValue(3));
    await expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled();
  },
);

WithClearedFieldRevalidation.test(
  "Shows the default of a reset field when the page revalidates after the save",
  async ({ canvas }) => {
    const retries = canvas.getByRole("spinbutton", { name: "Retries" });

    await userEvent.clear(retries);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));

    await expect(
      await canvas.findByText("Settings saved. Restart Riven to apply them."),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Revalidate" }));

    await waitFor(() => expect(retries).toHaveValue(3));
    await expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled();
  },
);
