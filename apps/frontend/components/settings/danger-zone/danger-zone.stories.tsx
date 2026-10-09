import { preview } from "#.storybook/preview.tsx";

import { DangerZone } from "./danger-zone.tsx";

const meta = preview.meta({
  title: "Settings / DangerZone",
  component: DangerZone,
});

export const Default = meta.story();
