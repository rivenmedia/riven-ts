import { preview } from "#.storybook/preview.tsx";

import { SettingsPage } from "./page.client.tsx";

const meta = preview.meta({
  title: "Pages / Settings",
  component: SettingsPage,
});

export const Default = meta.story();
