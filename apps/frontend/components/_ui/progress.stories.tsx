import { preview } from "#.storybook/preview.tsx";
import { Progress } from "#components/_ui/progress.tsx";

const meta = preview.meta({
  title: "UI / Progress",
  component: Progress,
  tags: ["autodocs"],
  args: {
    "aria-label": "Progress",
    value: 30,
    max: 100,
  },
});

/**
 * The default form of the progress.
 */
export const Default = meta.story();

/**
 * When the progress is indeterminate.
 */
export const Indeterminate = meta.story({
  args: {
    value: undefined,
  },
});

/**
 * When the progress is completed.
 */
export const Completed = meta.story({
  args: {
    value: 100,
  },
});

/**
 * When the progress is measured against a custom maximum.
 */
export const CustomMax = meta.story({
  args: {
    value: 3,
    max: 12,
  },
});
