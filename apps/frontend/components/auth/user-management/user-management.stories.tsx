import { preview } from "@/.storybook/preview";

import { expect, within } from "storybook/test";

import { UserManagement } from "./user-management";

const meta = preview.meta({
  title: "Auth / UserManagement",
  component: UserManagement,
});

export const Default = meta.story();

Default.test("Renders correctly", async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await expect(
    await canvas.findByRole("heading", {
      level: 1,
      name: "UserManagement",
    }),
  ).toBeInTheDocument();
});
