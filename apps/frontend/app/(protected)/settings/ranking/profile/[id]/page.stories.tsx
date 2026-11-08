import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";
import {
  createRankingProfilesHandler,
  rankingProfileSchemaHandler,
} from "#mocks/handlers/ranking-profiles.handler.ts";

import {
  customProfile,
  defaultProfile,
} from "../../_components/ranking-profiles.fixtures";
import EditRankingProfilePage from "./page";

const meta = preview.meta({
  title: "Pages / Settings / Edit Ranking Profile",
  component: EditRankingProfilePage,
  args: {
    params: Promise.resolve({ id: customProfile.id }),
    searchParams: Promise.resolve({}),
  },
  beforeEach({ msw }) {
    msw.use(
      createHasPermissionHandler({ instance: ["manage-settings"] }),
      rankingProfileSchemaHandler,
      createRankingProfilesHandler([defaultProfile, customProfile]),
    );
  },
});

export const Default = meta.story();

Default.test("Shows the profile's values", async ({ canvas }) => {
  await expect(
    await canvas.findByRole("textbox", { name: "Name" }),
  ).toHaveValue("Mine");
  await expect(
    canvas.getByRole("textbox", { name: "Description" }),
  ).toHaveValue("My own tweaks.");
  await expect(
    canvas.getByRole("button", { name: "Save profile" }),
  ).toBeDisabled();
});
