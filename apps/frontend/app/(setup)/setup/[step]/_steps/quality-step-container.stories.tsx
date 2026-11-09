import { HttpResponse } from "msw";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import {
  customProfile,
  defaultProfile,
  toMutationResult,
} from "#app/(protected)/settings/ranking/_components/ranking-profiles.fixtures.ts";
import { SELECT_RANKING_PROFILE } from "#app/(protected)/settings/ranking/_mutations/select-ranking-profile.mutation.ts";
import { api } from "#mocks/graphql.ts";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";
import { createRankingProfilesHandler } from "#mocks/handlers/ranking-profiles.handler.ts";

import { SetupQualityStepContainer } from "./quality-step-container.tsx";

import type { SelectRankingProfileMutation } from "#app/(protected)/settings/ranking/_mutations/select-ranking-profile.mutation.typegen.ts";

/** Matches a radio's accessible name, which also holds the profile description. */
const startsWith = (prefix: string) => (name: string) =>
  name.startsWith(prefix);

const selectRankingProfileRequest = fn<(id: string) => void>();

const meta = preview.meta({
  title: "Setup / Quality Container",
  component: SetupQualityStepContainer,
  beforeEach({ msw }) {
    selectRankingProfileRequest.mockClear();

    msw.use(
      createHasPermissionHandler({ instance: ["manage-settings"] }),
      createRankingProfilesHandler([
        { ...defaultProfile, isActive: false },
        { ...customProfile, isActive: true },
      ]),
      api.mutation(SELECT_RANKING_PROFILE, ({ variables }) => {
        selectRankingProfileRequest(variables.id);

        return HttpResponse.json({
          data: {
            selectRankingProfile: toMutationResult(),
          } satisfies SelectRankingProfileMutation,
        });
      }),
    );
  },
});

/** The served ranking profiles, with the active one pre-selected. */
export const Default = meta.story();

Default.test(
  "Pre-selects the active profile and selects the chosen one on save",
  async ({ canvas }) => {
    const active = await canvas.findByRole("radio", {
      name: startsWith(customProfile.name),
    });

    await expect(active).toBeChecked();
    await expect(
      canvas.getByRole("radio", { name: startsWith(defaultProfile.name) }),
    ).not.toBeChecked();

    await userEvent.click(
      canvas.getByRole("radio", { name: startsWith(defaultProfile.name) }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Save preferences" }),
    );

    await waitFor(() =>
      expect(selectRankingProfileRequest).toHaveBeenCalledWith(
        defaultProfile.id,
      ),
    );
  },
);
