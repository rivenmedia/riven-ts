import { preview } from "#.storybook/preview.tsx";
import { LoadingSpinner } from "#components/logs-viewer/loading-spinner/loading-spinner.tsx";

const meta = preview.meta({
  title: "Logs Viewer / LoadingSpinner",
  component: LoadingSpinner,
});

export const Default = meta.story({
  args: {
    message: "Loading historical logs...",
  },
});
