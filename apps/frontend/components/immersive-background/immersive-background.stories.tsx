import { ImmersiveBackground } from "@repo/util-ui/components/immersive-background/immersive-background.tsx";

import { preview } from "#.storybook/preview.tsx";

const meta = preview.meta({
  title: "Components / ImmersiveBackground",
  component: ImmersiveBackground,
});

export const Default = meta.story();
