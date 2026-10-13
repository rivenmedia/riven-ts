import { SectionHeading } from "@repo/util-ui/components/media/section-heading/section-heading.tsx";

import { preview } from "#.storybook/preview.tsx";

const meta = preview.meta({
  title: "Media / SectionHeading",
  component: SectionHeading,
  globals: {
    viewport: {
      value: "mobile2",
    },
  },
});

export const Default = meta.story({
  args: { title: "More Details" },
});

export const LongTitle = meta.story({
  args: { title: "A Much Longer Section Heading For Testing Wrap Behavior" },
});
