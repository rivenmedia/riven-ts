import { HttpResponse } from "msw";

import { SETTINGS_SECTION } from "#app/(protected)/settings/_components/settings-section/_queries/settings-section.query.ts";
import { api } from "#mocks/graphql.ts";

import type { SettingsSectionQuery } from "#app/(protected)/settings/_components/settings-section/_queries/settings-section.query.typegen.ts";

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
      } satisfies SettingsSectionQuery,
    }),
);
