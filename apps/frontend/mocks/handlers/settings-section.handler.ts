import { HttpResponse } from "msw/http";

import { UPDATE_SETTINGS_SECTION } from "#app/(protected)/settings/_components/settings-section/_mutations/update-settings-section.mutation.ts";
import { SETTINGS_SECTION } from "#app/(protected)/settings/_components/settings-section/_queries/settings-section.query.ts";
import { api } from "#mocks/graphql.ts";

import type { SecretState } from "#app/_types/__generated__/graphql.ts";

interface ServedSettingsSection {
  id: string;
  properties: Record<string, unknown>;
  values: Record<string, unknown>;
  secretStates?: { path: string; state: SecretState }[];
}

/** A "General" settings section of the given settings, as `SETTINGS_SECTION` serves it */
const toServedSettingsSection = ({
  id,
  properties,
  values,
  secretStates = [],
}: ServedSettingsSection) => ({
  __typename: "SettingsSection" as const,
  id,
  title: "General",
  appliesImmediately: false,
  jsonSchema: { type: "object", properties },
  values,
  lockedFields: [],
  secretStates: secretStates.map(({ path, state }) => ({
    __typename: "SecretFieldState" as const,
    path,
    state,
  })),
  issues: [],
});

/** Mocks every settings section as a section with a single "Log Directory" setting */
export const logDirectorySettingsSectionHandler = api.query(
  SETTINGS_SECTION,
  ({ variables }) =>
    HttpResponse.json({
      data: {
        settingsSection: toServedSettingsSection({
          id: variables.id,
          properties: {
            logDirectory: {
              type: "string",
              title: "Log Directory",
              default: "./logs",
            },
          },
          values: { logDirectory: "./logs" },
        }),
      },
    }),
);

interface SettingJsonSchema {
  default?: unknown;
  secret?: boolean;
  [keyword: string]: unknown;
}

interface SettingsSectionStoreOptions {
  /** The section's settings, which are all top-level. */
  properties: Record<string, SettingJsonSchema>;
  /** The settings' stored values, which their defaults fill in. */
  values: Record<string, unknown>;
  /** Where each secret's value comes from. */
  secretStates?: Record<string, SecretState>;
}

/**
 * Mocks every settings section as the given section, storing its values as
 * they're saved, like Riven does: a reset setting returns to its default, and
 * a blank secret is left unchanged.
 */
export const createSettingsSectionStore = ({
  properties,
  values: initialValues,
  secretStates: initialSecretStates = {},
}: SettingsSectionStoreOptions) => {
  const values = new Map(Object.entries(initialValues));
  const secretStates = new Map(Object.entries(initialSecretStates));

  const isSecret = (key: string) => properties[key]?.secret === true;

  /** The served values: each setting's stored value, or its default. Secrets are never served. */
  const getServedValues = () =>
    Object.fromEntries(
      Object.entries(properties)
        .filter(([key]) => !isSecret(key))
        .flatMap(([key, { default: defaultValue }]) => {
          const value = values.has(key) ? values.get(key) : defaultValue;

          return value === undefined ? [] : [[key, value]];
        }),
    );

  return {
    handlers: [
      api.query(SETTINGS_SECTION, ({ variables }) =>
        HttpResponse.json({
          data: {
            settingsSection: toServedSettingsSection({
              id: variables.id,
              properties,
              values: getServedValues(),
              secretStates: [...secretStates].map(([path, state]) => ({
                path,
                state,
              })),
            }),
          },
        }),
      ),
      api.mutation(
        UPDATE_SETTINGS_SECTION,
        ({ variables: { values: changedValues, reset } }) => {
          // A list variable may be sent as a single value
          const resetKeys = Array.isArray(reset) ? reset : [reset];

          // Riven refuses settings the section doesn't have
          const unknownKeys = [
            ...Object.keys(changedValues),
            ...resetKeys,
          ].filter((key) => !(key in properties));

          if (unknownKeys.length > 0) {
            return HttpResponse.json({
              data: {
                updateSettingsSection: {
                  __typename: "SettingsMutationResult",
                  success: false,
                  issues: unknownKeys.map((key) => ({
                    __typename: "SettingsIssue",
                    path: key,
                    message: "Unknown setting",
                  })),
                },
              },
            });
          }

          for (const [key, value] of Object.entries(changedValues)) {
            if (!isSecret(key)) {
              values.set(key, value);
            } else if (value !== "") {
              secretStates.set(key, "custom");
            }
          }

          for (const key of resetKeys) {
            values.delete(key);
          }

          return HttpResponse.json({
            data: {
              updateSettingsSection: {
                __typename: "SettingsMutationResult",
                success: true,
                issues: [],
              },
            },
          });
        },
      ),
    ],
  };
};
