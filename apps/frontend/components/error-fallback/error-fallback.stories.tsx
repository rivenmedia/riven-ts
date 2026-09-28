import { preview } from "@/.storybook/preview";

import { ErrorFallback } from "./error-fallback";

function ErroringComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("An error has occurred");
  }

  return null;
}

const meta = preview.meta({
  title: "Components / ErrorFallback",
  component: ErrorFallback,
  args: {
    message: "An error has occurred",
  },
  render: (args) => (
    <ErrorFallback {...args}>
      <ErroringComponent shouldThrow />
    </ErrorFallback>
  ),
});

export const Default = meta.story();
