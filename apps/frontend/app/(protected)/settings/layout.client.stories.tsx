import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { HttpResponse } from "msw";
import { expect, userEvent, waitFor } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { api } from "#mocks/graphql.ts";

import { INSTANCE_RESTART_STATUS } from "./_components/restart-banner/_queries/instance-restart-status.query";
import { SETTINGS_SECTION } from "./_components/settings-section/_queries/settings-section.query";
import GeneralSettingsPage from "./general/page";
import { SettingsLayout } from "./layout.client";
import PluginSettingsPage from "./plugins/[plugin]/page";
import { SETTINGS_PLUGINS } from "./plugins/_queries/settings-plugins.query";
import PluginsSettingsLayout from "./plugins/layout";

const restartStatusHandler = (restartRequired: boolean) =>
  api.query(INSTANCE_RESTART_STATUS, () =>
    HttpResponse.json({
      data: {
        instanceStatus: {
          __typename: "InstanceStatus",
          restartRequired,
        },
      },
    }),
  );

// `segments` sets the selected layout segments, but isn't in Storybook's types
const generalNavigation = {
  pathname: "/settings/general",
  segments: ["general"],
} as const;

const pluginNavigation = {
  pathname: "/settings/plugins/repo-plugin-comet",
  segments: ["plugins", ["plugin", "repo-plugin-comet"]],
} as const;

const sectionTitles: Record<string, string> = {
  general: "General",
  "repo-plugin-comet": "Comet",
};

const meta = preview.meta({
  title: "Pages / Settings",
  component: SettingsLayout,
  args: {
    children: <GeneralSettingsPage />,
  },
  parameters: {
    nextjs: {
      navigation: generalNavigation,
    },
  },
  beforeEach({ msw }) {
    msw.use(
      restartStatusHandler(false),
      api.query(SETTINGS_SECTION, ({ variables }) =>
        HttpResponse.json({
          data: {
            settingsSection: {
              __typename: "SettingsSection",
              id: variables.id,
              title: sectionTitles[variables.id] ?? variables.id,
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
      ),
      api.query(SETTINGS_PLUGINS, () =>
        HttpResponse.json({
          data: {
            settingsPlugins: {
              __typename: "PluginList",
              enabledPluginsLocked: false,
              plugins: [
                {
                  __typename: "PluginSummary",
                  id: "repo-plugin-tmdb",
                  title: "TMDB",
                  enabled: true,
                  alwaysEnabled: true,
                },
                {
                  __typename: "PluginSummary",
                  id: "repo-plugin-comet",
                  title: "Comet",
                  enabled: true,
                  alwaysEnabled: false,
                },
              ],
            },
          },
        }),
      ),
    );
  },
});

export const Default = meta.story();

Default.test("Shows the general settings", async ({ canvas }) => {
  await expect(
    await canvas.findByRole("tab", { name: "General", selected: true }),
  ).toBeInTheDocument();

  await expect(
    await canvas.findByRole("textbox", { name: "Log Directory" }),
  ).toBeInTheDocument();

  await expect(
    canvas.getByRole("heading", { name: "Danger zone" }),
  ).toBeInTheDocument();

  await expect(
    canvas.queryByText("Settings changed. Restart Riven to apply them."),
  ).not.toBeInTheDocument();
});

Default.test("Navigates to another section", async ({ canvas }) => {
  const router = getRouter();

  await userEvent.click(await canvas.findByRole("tab", { name: "Plugins" }));

  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith("/settings/plugins"),
  );
});

/** Saved settings only apply once Riven restarts. */
export const RestartRequired = meta.story({
  beforeEach({ msw }) {
    msw.use(restartStatusHandler(true));
  },
});

RestartRequired.test("Asks for a restart", async ({ canvas }) => {
  await expect(
    await canvas.findByText("Settings changed. Restart Riven to apply them."),
  ).toBeInTheDocument();
});

export const Plugins = meta.story({
  args: {
    children: (
      <PluginsSettingsLayout params={Promise.resolve({})}>
        <PluginSettingsPage
          params={Promise.resolve({ plugin: "repo-plugin-comet" })}
          searchParams={Promise.resolve({})}
        />
      </PluginsSettingsLayout>
    ),
  },
  parameters: {
    nextjs: {
      navigation: pluginNavigation,
    },
  },
});

Plugins.test("Shows the plugin's settings", async ({ canvas }) => {
  await expect(
    await canvas.findByRole("tab", { name: "Plugins", selected: true }),
  ).toBeInTheDocument();

  await expect(
    await canvas.findByRole("switch", { name: "Enable Comet" }),
  ).toBeEnabled();

  await expect(
    canvas.getByRole("switch", { name: "Enable TMDB" }),
  ).toBeDisabled();

  await expect(
    await canvas.findByRole("textbox", { name: "Log Directory" }),
  ).toBeInTheDocument();
});
