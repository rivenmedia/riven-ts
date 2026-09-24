import { preview } from "@/.storybook/preview";

import { DangerZone } from "./danger-zone";

const meta = preview.meta({
  title: "Settings / DangerZone",
  component: DangerZone,
});

export const Default = meta.story();
