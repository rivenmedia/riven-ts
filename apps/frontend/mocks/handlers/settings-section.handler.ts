import { HttpResponse } from "msw/http";

import { SETTINGS_SECTION } from "#app/(protected)/settings/_components/settings-section/_queries/settings-section.query.ts";
import { api } from "#mocks/graphql.ts";

/** Mocks every settings section as a section with a single "Log Directory" setting */
export const logDirectorySettingsSectionHandler = api.query(
  SETTINGS_SECTION,
  ({ variables }) =>
    HttpResponse.json({
      data: {
        settingsSection: {
          __typename: "SettingsSection",
          id: variables.id,
          title: "General",
          appliesImmediately: false,
          jsonSchema: {
            type: "object",
            properties: {
              logDirectory: {
                type: "string",
                title: "Log Directory",
                default: "./logs",
              },
            },
          },
          values: { logDirectory: "./logs" },
          lockedFields: [],
          secretStates: [],
          issues: [],
        },
      },
    }),
);

/** The stored values of the section that {@link everySettingTypeSectionHandler} serves */
export const everySettingTypeSectionValues = Object.freeze({
  logDirectory: "/var/log/riven",
  debugLogging: false,
  logLevel: "info",
  excludedWords: Object.freeze(["CAM"]),
  updateIntervalSeconds: 60,
  dubbedOnly: null,
});

/**
 * Mocks every settings section as a section with a setting of each type: a
 * defaulted text, a boolean, a select, a string array, a nullable number, a
 * nullable boolean and a custom secret.
 */
export const everySettingTypeSectionHandler = api.query(
  SETTINGS_SECTION,
  ({ variables }) =>
    HttpResponse.json({
      data: {
        settingsSection: {
          __typename: "SettingsSection",
          id: variables.id,
          title: "General",
          appliesImmediately: false,
          jsonSchema: {
            type: "object",
            properties: {
              logDirectory: {
                type: "string",
                title: "Log Directory",
                default: "./logs",
              },
              debugLogging: {
                type: "boolean",
                title: "Debug logging",
                default: false,
              },
              logLevel: {
                type: "string",
                enum: ["info", "debug", "warning"],
                title: "Log level",
                default: "info",
              },
              excludedWords: {
                type: "array",
                items: { type: "string" },
                title: "Excluded words",
                default: [],
              },
              updateIntervalSeconds: {
                anyOf: [{ type: "integer", minimum: 0 }, { type: "null" }],
                title: "Update interval",
                default: 60,
              },
              dubbedOnly: {
                anyOf: [{ type: "boolean" }, { type: "null" }],
                title: "Dubbed only",
                default: null,
              },
              apiKey: {
                type: "string",
                title: "API key",
                secret: true,
              },
            },
          },
          values: everySettingTypeSectionValues,
          lockedFields: [],
          secretStates: [
            { __typename: "SecretFieldState", path: "apiKey", state: "custom" },
          ],
          issues: [],
        },
      },
    }),
);
