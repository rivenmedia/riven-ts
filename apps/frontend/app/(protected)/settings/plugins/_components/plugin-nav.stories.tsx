import { HttpResponse } from "msw";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { api } from "#mocks/graphql.ts";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";

import { SET_PLUGIN_ENABLED } from "../_mutations/set-plugin-enabled.mutation";
import { PluginNav } from "./plugin-nav";

import type {
  SetPluginEnabledMutation,
  SetPluginEnabledMutationVariables,
} from "../_mutations/set-plugin-enabled.mutation.typegen";

const navigation = {
  pathname: "/settings/plugins/repo-plugin-comet",
  segments: [["plugin", "repo-plugin-comet"]],
} as const;

const setPluginEnabledRequest =
  fn<(variables: SetPluginEnabledMutationVariables) => void>();

const meta = preview.meta({
  title: "Settings / PluginNav",
  component: PluginNav,
  args: {
    enabledPluginsLocked: false,
    plugins: [
      {
        id: "repo-plugin-tmdb",
        title: "TMDB",
        enabled: true,
        alwaysEnabled: true,
      },
      {
        id: "repo-plugin-comet",
        title: "Comet",
        enabled: true,
        alwaysEnabled: false,
      },
      {
        id: "repo-plugin-stremthru",
        title: "StremThru",
        enabled: false,
        alwaysEnabled: false,
      },
    ],
  },
  parameters: {
    nextjs: {
      navigation,
    },
  },
  beforeEach({ msw }) {
    setPluginEnabledRequest.mockClear();

    msw.use(
      createHasPermissionHandler({ instance: ["manage-settings"] }),
      api.mutation(SET_PLUGIN_ENABLED, ({ variables }) => {
        setPluginEnabledRequest(variables);

        return HttpResponse.json({
          data: {
            setPluginEnabled: {
              __typename: "SettingsMutationResult",
              success: true,
              issues: [],
            },
          } satisfies SetPluginEnabledMutation,
        });
      }),
    );
  },
});

export const Default = meta.story();

Default.test("Links to each plugin's settings", async ({ canvas }) => {
  const cometLink = canvas.getByRole("link", { name: "Comet" });

  await expect(cometLink).toHaveAttribute(
    "href",
    "/settings/plugins/repo-plugin-comet",
  );
  await expect(cometLink).toHaveAttribute("aria-current", "page");
  await expect(
    canvas.getByRole("link", { name: "StremThru" }),
  ).not.toHaveAttribute("aria-current");
});

Default.test("Doesn't show the locked note", async ({ canvas }) => {
  await expect(
    canvas.queryByText("Set by environment variable"),
  ).not.toBeInTheDocument();
  await expect(
    canvas.getByRole("switch", { name: "Enable Comet" }),
  ).not.toHaveAccessibleDescription();
});

Default.test(
  "Disables the switch for an always-enabled plugin",
  async ({ canvas }) => {
    await expect(
      canvas.getByRole("switch", { name: "Enable TMDB" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("switch", { name: "Enable Comet" }),
    ).toBeEnabled();
  },
);

Default.test("Enables a plugin", async ({ canvas }) => {
  const stremThruSwitch = canvas.getByRole("switch", {
    name: "Enable StremThru",
  });

  await expect(stremThruSwitch).not.toBeChecked();

  await userEvent.click(stremThruSwitch);

  await waitFor(() =>
    expect(setPluginEnabledRequest).toHaveBeenCalledWith({
      id: "repo-plugin-stremthru",
      enabled: true,
    }),
  );
});

Default.test("Disables a plugin", async ({ canvas }) => {
  await userEvent.click(canvas.getByRole("switch", { name: "Enable Comet" }));

  await waitFor(() =>
    expect(setPluginEnabledRequest).toHaveBeenCalledWith({
      id: "repo-plugin-comet",
      enabled: false,
    }),
  );
});

/** Enabled plugins set by the environment can't be changed here. */
export const Locked = meta.story({
  args: { enabledPluginsLocked: true },
});

Locked.test("Disables every switch", async ({ canvas }) => {
  for (const name of ["Enable TMDB", "Enable Comet", "Enable StremThru"]) {
    await expect(canvas.getByRole("switch", { name })).toBeDisabled();
  }
});

Locked.test("Explains why the switches are locked", async ({ canvas }) => {
  await expect(canvas.getByText("Set by environment variable")).toBeVisible();

  for (const name of ["Enable TMDB", "Enable Comet", "Enable StremThru"]) {
    await expect(
      canvas.getByRole("switch", { name }),
    ).toHaveAccessibleDescription(
      "Set by environment variable Enabled plugins are set by the RIVEN_SETTING__enabledPlugins environment variable, so they can't be changed here.",
    );
  }
});

/** The backend rejected the change, e.g. a plugin that failed to load. */
export const RejectedChange = meta.story({
  beforeEach({ msw }) {
    msw.use(
      api.mutation(SET_PLUGIN_ENABLED, ({ variables }) => {
        setPluginEnabledRequest(variables);

        return HttpResponse.json({
          data: {
            setPluginEnabled: {
              __typename: "SettingsMutationResult",
              success: false,
              issues: [
                {
                  __typename: "SettingsIssue",
                  path: "",
                  message: "StremThru failed to validate its settings",
                },
              ],
            },
          } satisfies SetPluginEnabledMutation,
        });
      }),
    );
  },
});

RejectedChange.test(
  "Shows each issue and reverts the switch",
  async ({ canvas }) => {
    const stremThruSwitch = canvas.getByRole("switch", {
      name: "Enable StremThru",
    });

    await userEvent.click(stremThruSwitch);

    await expect(
      await canvas.findByText("StremThru failed to validate its settings"),
    ).toBeInTheDocument();
    await waitFor(() => expect(stremThruSwitch).not.toBeChecked());
  },
);
