import { HttpResponse } from "msw";

import { preview } from "#.storybook/preview.tsx";
import { SETTINGS_SECTION } from "#app/(protected)/settings/_components/settings-section/_queries/settings-section.query.ts";
import { SettingsPage } from "#app/(protected)/settings/page.client.tsx";
import { api } from "#mocks/graphql.ts";

import type { SettingsSectionQuery } from "#app/(protected)/settings/_components/settings-section/_queries/settings-section.query.typegen.ts";

const meta = preview.meta({
  title: "Pages / Settings",
  component: SettingsPage,
  beforeEach({ msw }) {
    msw.use(
      api.query(SETTINGS_SECTION, () =>
        HttpResponse.json({
          data: {
            settingsSection: {
              __typename: "SettingsSection",
              id: "general",
              title: "General",
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
      ),
    );
  },
});

export const Default = meta.story();
