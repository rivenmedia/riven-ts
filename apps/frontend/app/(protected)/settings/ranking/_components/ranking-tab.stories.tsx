import { HttpResponse } from "msw";
import { expect, userEvent } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { api } from "#mocks/graphql.ts";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";
import { createRankingProfilesHandler } from "#mocks/handlers/ranking-profiles.handler.ts";

import { SETTINGS_SECTION } from "../../_components/settings-section/_queries/settings-section.query";
import { customProfile, defaultProfile } from "./ranking-profiles.fixtures";
import { RankingTab } from "./ranking-tab";

import type { SettingsSectionQuery } from "../../_components/settings-section/_queries/settings-section.query.typegen";

const meta = preview.meta({
  title: "Settings / RankingTab",
  component: RankingTab,
  beforeEach({ msw }) {
    msw.use(
      createHasPermissionHandler({ instance: ["manage-settings"] }),
      createRankingProfilesHandler([defaultProfile, customProfile]),
      api.query(SETTINGS_SECTION, ({ variables }) =>
        HttpResponse.json({
          data: {
            settingsSection: {
              __typename: "SettingsSection",
              id: variables.id,
              title: "Ranking Settings",
              appliesImmediately: true,
              jsonSchema: {
                type: "object",
                properties: {
                  options: {
                    type: "object",
                    title: "Options",
                    description:
                      "Configure various options for torrent ranking",
                    properties: {
                      removeAllTrash: {
                        type: "boolean",
                        title: "Remove all trash",
                        default: true,
                      },
                    },
                  },
                },
              },
              values: { options: { removeAllTrash: true } },
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

Default.test("Shows the ranking profiles", async ({ canvas }) => {
  await expect(
    canvas.getByRole("tab", { name: "Ranking Profiles", selected: true }),
  ).toBeInTheDocument();

  await expect(await canvas.findByText("Mine")).toBeInTheDocument();
});

Default.test("Switches to the ranking settings", async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("tab", { name: "Ranking Settings" }));

  await expect(
    await canvas.findByRole("switch", { name: "Remove all trash" }),
  ).toBeChecked();
});
