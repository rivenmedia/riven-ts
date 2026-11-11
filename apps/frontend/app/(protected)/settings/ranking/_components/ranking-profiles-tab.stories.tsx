import { HttpResponse } from "msw";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { api } from "#mocks/graphql.ts";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";
import { createRankingProfilesHandler } from "#mocks/handlers/ranking-profiles.handler.ts";

import { DELETE_RANKING_PROFILE } from "../_mutations/delete-ranking-profile.mutation";
import { DUPLICATE_RANKING_PROFILE } from "../_mutations/duplicate-ranking-profile.mutation";
import { SELECT_RANKING_PROFILE } from "../_mutations/select-ranking-profile.mutation";
import { RankingProfilesTab } from "./ranking-profiles-tab";
import {
  customProfile,
  defaultProfile,
  toMutationResult,
} from "./ranking-profiles.fixtures";

const selectRankingProfileRequest = fn<(id: string) => void>();
const duplicateRankingProfileRequest = fn<(id: string) => void>();
const deleteRankingProfileRequest = fn<(id: string) => void>();

/** The card of the profile with the given name. */
const findProfileCard = async (canvasElement: HTMLElement, name: string) => {
  const title = await within(canvasElement).findByText(name);
  const card = title.closest<HTMLElement>('[data-slot="card"]');

  expect.assert(card);

  return within(card);
};

const meta = preview.meta({
  title: "Settings / RankingProfilesTab",
  component: RankingProfilesTab,
  beforeEach({ msw }) {
    selectRankingProfileRequest.mockClear();
    duplicateRankingProfileRequest.mockClear();
    deleteRankingProfileRequest.mockClear();

    msw.use(
      createHasPermissionHandler({ instance: ["manage-settings"] }),
      createRankingProfilesHandler([defaultProfile, customProfile]),
      api.mutation(SELECT_RANKING_PROFILE, ({ variables }) => {
        selectRankingProfileRequest(variables.id);

        return HttpResponse.json({
          data: {
            selectRankingProfile: toMutationResult(),
          },
        });
      }),
      api.mutation(DUPLICATE_RANKING_PROFILE, ({ variables }) => {
        duplicateRankingProfileRequest(variables.id);

        return HttpResponse.json({
          data: {
            duplicateRankingProfile: toMutationResult(),
          },
        });
      }),
      api.mutation(DELETE_RANKING_PROFILE, ({ variables }) => {
        deleteRankingProfileRequest(variables.id);

        return HttpResponse.json({
          data: {
            deleteRankingProfile: toMutationResult(),
          },
        });
      }),
    );
  },
});

/** The built-in default profile is active, alongside a custom profile. */
export const Default = meta.story();

Default.test(
  "Shows the actions each profile allows",
  async ({ canvasElement, step }) => {
    await step("A built-in profile can only be duplicated", async () => {
      const defaultCard = await findProfileCard(canvasElement, "Default");

      await expect(
        defaultCard.getByRole("button", { name: "Selected" }),
      ).toBeDisabled();
      await expect(
        defaultCard.getByRole("button", { name: "Duplicate" }),
      ).toBeEnabled();
      await expect(
        defaultCard.queryByRole("link", { name: "Edit" }),
      ).not.toBeInTheDocument();
      await expect(
        defaultCard.queryByRole("button", { name: "Delete" }),
      ).not.toBeInTheDocument();
    });

    await step("A custom profile can be edited and deleted", async () => {
      const mineCard = await findProfileCard(canvasElement, "Mine");

      await expect(
        mineCard.getByRole("button", { name: "Select" }),
      ).toBeEnabled();
      await expect(
        mineCard.getByRole("link", { name: "Edit" }),
      ).toHaveAttribute(
        "href",
        `/settings/ranking/profile/${customProfile.id}`,
      );
      await expect(
        mineCard.getByRole("button", { name: "Duplicate" }),
      ).toBeEnabled();
      await expect(
        mineCard.getByRole("button", { name: "Delete" }),
      ).toBeEnabled();
    });
  },
);

Default.test("Selects a profile", async ({ canvas, canvasElement }) => {
  const mineCard = await findProfileCard(canvasElement, "Mine");

  await userEvent.click(mineCard.getByRole("button", { name: "Select" }));

  await waitFor(() =>
    expect(selectRankingProfileRequest).toHaveBeenCalledWith(customProfile.id),
  );
  await expect(
    await canvas.findByText("Ranking profile selected."),
  ).toBeInTheDocument();
});

Default.test("Duplicates a profile", async ({ canvas, canvasElement }) => {
  const defaultCard = await findProfileCard(canvasElement, "Default");

  await userEvent.click(defaultCard.getByRole("button", { name: "Duplicate" }));

  await waitFor(() =>
    expect(duplicateRankingProfileRequest).toHaveBeenCalledWith(
      defaultProfile.id,
    ),
  );
  await expect(
    await canvas.findByText("Ranking profile duplicated."),
  ).toBeInTheDocument();
});

Default.test("Deletes a custom profile", async ({ canvas, canvasElement }) => {
  const mineCard = await findProfileCard(canvasElement, "Mine");

  await userEvent.click(mineCard.getByRole("button", { name: "Delete" }));

  const dialog = within(
    await within(canvasElement.ownerDocument.body).findByRole("alertdialog", {
      name: "Delete ranking profile?",
    }),
  );

  await userEvent.click(dialog.getByRole("button", { name: "Delete" }));

  await waitFor(() =>
    expect(deleteRankingProfileRequest).toHaveBeenCalledWith(customProfile.id),
  );
  await expect(
    await canvas.findByText("Ranking profile deleted."),
  ).toBeInTheDocument();
});

Default.test(
  "Shows the issue of a refused action",
  async ({ canvas, canvasElement, msw }) => {
    msw.use(
      api.mutation(SELECT_RANKING_PROFILE, () =>
        HttpResponse.json({
          data: {
            selectRankingProfile: toMutationResult([
              { path: "", message: "Ranking profile not found." },
            ]),
          },
        }),
      ),
    );

    const mineCard = await findProfileCard(canvasElement, "Mine");

    await userEvent.click(mineCard.getByRole("button", { name: "Select" }));

    await expect(
      await canvas.findByText("Ranking profile not found."),
    ).toBeInTheDocument();
  },
);

/** The custom profile is active, so it can't be deleted. */
export const CustomProfileActive = meta.story({
  beforeEach({ msw }) {
    msw.use(
      createRankingProfilesHandler([
        { ...defaultProfile, isActive: false },
        { ...customProfile, isActive: true },
      ]),
    );
  },
});

CustomProfileActive.test(
  "Can't delete the active profile",
  async ({ canvasElement }) => {
    const mineCard = await findProfileCard(canvasElement, "Mine");

    await expect(
      mineCard.getByRole("button", { name: "Selected" }),
    ).toBeDisabled();
    await expect(
      mineCard.getByRole("button", { name: "Delete" }),
    ).toBeDisabled();

    const defaultCard = await findProfileCard(canvasElement, "Default");

    await expect(
      defaultCard.getByRole("button", { name: "Select" }),
    ).toBeEnabled();
  },
);

/** Only the built-in profile exists. */
export const NoCustomProfiles = meta.story({
  beforeEach({ msw }) {
    msw.use(createRankingProfilesHandler([defaultProfile]));
  },
});

NoCustomProfiles.test(
  "Says there are no custom profiles",
  async ({ canvas }) => {
    await expect(
      await canvas.findByText("No custom profiles yet."),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "Create Custom Profile" }),
    ).toHaveAttribute("href", "/settings/ranking/profile/create");
  },
);
