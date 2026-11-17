import { redirect } from "@storybook/nextjs-vite/navigation.mock";
import { HttpResponse } from "msw";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { api } from "#mocks/graphql.ts";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";

import { CREATE_RANKING_PROFILE } from "../_mutations/create-ranking-profile.mutation";
import { UPDATE_RANKING_PROFILE } from "../_mutations/update-ranking-profile.mutation";
import { RankingProfileForm } from "./ranking-profile-form";
import {
  customProfile,
  defaultProfile,
  rankingProfileJsonSchema,
  toMutationResult,
} from "./ranking-profiles.fixtures";

import type { CreateRankingProfileMutationVariables } from "../_mutations/create-ranking-profile.mutation.typegen";
import type { UpdateRankingProfileMutationVariables } from "../_mutations/update-ranking-profile.mutation.typegen";

const createRankingProfileRequest =
  fn<(variables: CreateRankingProfileMutationVariables) => void>();
const updateRankingProfileRequest =
  fn<(variables: UpdateRankingProfileMutationVariables) => void>();

const getLastCreatedValues = () =>
  createRankingProfileRequest.mock.lastCall?.[0].values;

const meta = preview.meta({
  title: "Settings / RankingProfileForm",
  component: RankingProfileForm,
  args: {
    jsonSchema: rankingProfileJsonSchema,
    values: { ...defaultProfile.values, name: "", description: null },
  },
  beforeEach({ msw }) {
    createRankingProfileRequest.mockClear();
    updateRankingProfileRequest.mockClear();

    msw.use(
      createHasPermissionHandler({ instance: ["manage-settings"] }),
      api.mutation(CREATE_RANKING_PROFILE, ({ variables }) => {
        createRankingProfileRequest(variables);

        return HttpResponse.json({
          data: {
            createRankingProfile: toMutationResult(),
          },
        });
      }),
      api.mutation(UPDATE_RANKING_PROFILE, ({ variables }) => {
        updateRankingProfileRequest(variables);

        return HttpResponse.json({
          data: {
            updateRankingProfile: toMutationResult(),
          },
        });
      }),
    );
  },
});

/** Creating a profile, starting from the default profile's values. */
export const Create = meta.story();

Create.test("Renders the profile's titled groups", async ({ canvas }) => {
  for (const title of [
    "Quality",
    "Rips",
    "HDR",
    "Audio",
    "Extras",
    "Trash",
    "Ranks",
    "Settings",
    "Options",
  ]) {
    await expect(
      canvas.getByRole("heading", { name: title }),
    ).toBeInTheDocument();
  }

  await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("");
});

Create.test(
  "Creates the profile and returns to the profiles",
  async ({ canvas }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: "Name" }), "Mine");
    await userEvent.click(
      canvas.getByRole("button", { name: "Create profile" }),
    );

    await waitFor(() => expect(createRankingProfileRequest).toHaveBeenCalled());

    await expect(getLastCreatedValues()).toStrictEqual({
      ...defaultProfile.values,
      name: "Mine",
      description: null,
    });

    await waitFor(() =>
      expect(redirect).toHaveBeenCalledWith("/settings/ranking"),
    );
  },
);

Create.test("Shows the issue of a refused name", async ({ canvas, msw }) => {
  msw.use(
    api.mutation(CREATE_RANKING_PROFILE, () =>
      HttpResponse.json({
        data: {
          createRankingProfile: toMutationResult([
            {
              path: "name",
              message: "A profile with this name already exists.",
            },
          ]),
        },
      }),
    ),
  );

  await userEvent.type(
    canvas.getByRole("textbox", { name: "Name" }),
    "Default",
  );
  await userEvent.click(canvas.getByRole("button", { name: "Create profile" }));

  await expect(
    await canvas.findByText("A profile with this name already exists."),
  ).toBeInTheDocument();
  await expect(redirect).not.toHaveBeenCalled();
});

/** Editing an existing custom profile. */
export const Edit = meta.story({
  args: {
    profileId: customProfile.id,
    values: customProfile.values,
  },
});

Edit.test("Saves the profile's changes", async ({ canvas }) => {
  const name = canvas.getByRole("textbox", { name: "Name" });

  await expect(name).toHaveValue("Mine");

  await userEvent.clear(name);
  await userEvent.type(name, "Mine, renamed");
  await userEvent.click(canvas.getByRole("button", { name: "Save profile" }));

  await waitFor(() =>
    expect(updateRankingProfileRequest).toHaveBeenCalledWith({
      id: customProfile.id,
      values: { ...customProfile.values, name: "Mine, renamed" },
    }),
  );

  await waitFor(() =>
    expect(redirect).toHaveBeenCalledWith("/settings/ranking"),
  );
});

Edit.test(
  "Shows an emptied rank's issue on its field instead of saving",
  async ({ canvas }) => {
    const rankInput = canvas.getByRole("spinbutton", { name: "Av1 rank" });

    await userEvent.clear(rankInput);
    await userEvent.click(canvas.getByRole("button", { name: "Save profile" }));

    const alert = await canvas.findByRole("alert");

    await expect(alert).toHaveTextContent(/expected number/iu);
    await expect(alert.parentElement).toContainElement(rankInput);
    await expect(rankInput).toHaveFocus();
    await expect(updateRankingProfileRequest).not.toHaveBeenCalled();
  },
);

Edit.test(
  "Shows the refused rank's issue on its field",
  async ({ canvas, msw }) => {
    msw.use(
      api.mutation(UPDATE_RANKING_PROFILE, () =>
        HttpResponse.json({
          data: {
            updateRankingProfile: toMutationResult([
              {
                path: "ranks.quality.av1.rank",
                message: "Enter a rank, or turn off fetching.",
              },
            ]),
          },
        }),
      ),
    );

    await userEvent.type(canvas.getByRole("textbox", { name: "Name" }), "2");
    await userEvent.click(canvas.getByRole("button", { name: "Save profile" }));

    const alert = await canvas.findByRole("alert");

    // On the field, rather than for the form at the issue's path
    await expect(alert).toHaveTextContent(
      /^Enter a rank, or turn off fetching\.$/u,
    );
    await expect(alert.parentElement).toContainElement(
      canvas.getByRole("spinbutton", { name: "Av1 rank" }),
    );
    await expect(redirect).not.toHaveBeenCalled();
  },
);
