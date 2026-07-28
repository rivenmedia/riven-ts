import { preview } from "@/.storybook/preview";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Use to show a placeholder while content is loading.
 */
const meta = preview.meta({
  title: "ui/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the skeleton.
 */
export const Default = meta.story({
  render: (args) => (
    <div className="flex items-center space-x-4">
      <Skeleton {...args} className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton {...args} className="h-4 w-62.5" />
        <Skeleton {...args} className="h-4 w-50" />
      </div>
    </div>
  ),
});
