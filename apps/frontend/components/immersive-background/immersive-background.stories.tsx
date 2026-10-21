import { preview } from "#.storybook/preview.tsx";
import { ImmersiveBackground } from "#components/immersive-background/immersive-background.tsx";

const meta = preview.meta({
  title: "Components / ImmersiveBackground",
  component: ImmersiveBackground,
});

export const Default = meta.story();
