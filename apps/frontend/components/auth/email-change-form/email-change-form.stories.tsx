import { preview } from "#.storybook/preview.tsx";

import { EmailChangeForm } from "./email-change-form.tsx";

const meta = preview.meta({
  title: "Auth / EmailChangeForm",
  component: EmailChangeForm,
});

export const Default = meta.story();
