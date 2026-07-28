import { preview } from "@/.storybook/preview";
import { Slider } from "@/components/ui/slider";

/**
 * An input where the user selects a value from within a given range.
 */
const meta = preview.meta({
  title: "ui/Slider",
  component: Slider,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    defaultValue: [33],
    max: 100,
    step: 1,
  },
});

/**
 * The default form of the slider.
 */
export const Default = meta.story({});

/**
 * Use the `inverted` prop to have the slider fill from right to left.
 */
export const Inverted = meta.story({
  args: {
    inverted: true,
  },
});

/**
 * Use the `disabled` prop to disable the slider.
 */
export const Disabled = meta.story({
  args: {
    disabled: true,
  },
});
