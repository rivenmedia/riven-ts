import { preview } from "#.storybook/preview.tsx";
import { GeneralTab } from "#components/settings/general-tab/general-tab.tsx";

const meta = preview.meta({
  title: "Settings / GeneralTab",
  component: GeneralTab,
  args: {
    data: {
      instanceName: "My Instance",
      logLevel: "INFO" as const,
      enableNotifications: true,
    },
  },
});

export const Default = meta.story();
