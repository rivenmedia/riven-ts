import { preview } from "@/.storybook/preview";

import { GeneralTab } from "./general-tab";

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
