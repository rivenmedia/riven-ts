import { preview } from "@/.storybook/preview";

import { EmailChangeForm } from "./email-change-form";

const meta = preview.meta({
  title: "Auth / EmailChangeForm",
  component: EmailChangeForm,
});

export const Default = meta.story();
