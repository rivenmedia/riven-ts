import { preview } from "@/.storybook/preview";

import { SettingsPage } from "./page.client";

const meta = preview.meta({
  title: "Pages / Settings",
  component: SettingsPage,
});

export const Default = meta.story();
