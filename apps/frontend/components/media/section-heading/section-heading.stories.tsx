import { preview } from "@/.storybook/preview";

import { SectionHeading } from "./section-heading";

const meta = preview.meta({
  title: "Media / SectionHeading",
  component: SectionHeading,
});

export const Default = meta.story({
  args: { title: "More Details" },
});

export const LongTitle = meta.story({
  args: { title: "A Much Longer Section Heading For Testing Wrap Behavior" },
});
