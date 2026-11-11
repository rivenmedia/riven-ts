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
import CreateRankingProfilePage from "./page";

const meta = preview.meta({
  title: "Pages / Settings / Create Ranking Profile",
  component: CreateRankingProfilePage,
  beforeEach({ msw }) {
    msw.use(
      createHasPermissionHandler({ instance: ["manage-settings"] }),
      rankingProfileSchemaHandler,
      createRankingProfilesHandler([
        { ...defaultProfile, isActive: false },
        { ...customProfile, isActive: true },
      ]),
    );
  },
});

export const Default = meta.story();

Default.test(
  "Starts from the default profile, without its name",
  async ({ canvas }) => {
    await expect(
      await canvas.findByRole("textbox", { name: "Name" }),
    ).toHaveValue("");
    await expect(
      canvas.getByRole("textbox", { name: "Description" }),
    ).toHaveValue("");
    await expect(
      canvas.getByRole("spinbutton", { name: "Av1 rank" }),
    ).toHaveValue(500);
    await expect(
      canvas.getByRole("button", { name: "Create profile" }),
    ).toBeDisabled();
  },
);
