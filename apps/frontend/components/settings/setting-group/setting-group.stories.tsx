import { createFormDecorator } from "@/.storybook/decorators/create-form-decorator";
import { preview } from "@/.storybook/preview";

import { SettingGroup } from "./setting-group";

const meta = preview.meta({
  title: "Settings / SettingGroup",
  component: SettingGroup,
});

export const Default = meta.story({
  args: {
    title: "My Setting Group",
    schema: [
      {
        type: "text",
        config: {
          name: "setting1",
          label: "Setting 1",
        },
      },
      {
        type: "boolean",
        config: {
          name: "setting2",
          label: "Setting 2",
        },
      },
    ],
  },
  decorators: [
    createFormDecorator({
      defaultValues: {
        setting1: "Setting 1 value",
        setting2: true,
      },
    }),
  ],
});
