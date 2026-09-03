import { preview } from "@/.storybook/preview";

import { LoadingSpinner } from "./loading-spinner";

const meta = preview.meta({
  title: "Logs / LoadingSpinner",
  component: LoadingSpinner,
});

export const Default = meta.story({
  args: {
    message: "Loading historical logs...",
  },
});
