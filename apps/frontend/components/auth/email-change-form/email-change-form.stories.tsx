import { preview } from "#.storybook/preview.tsx";
import { EmailChangeForm } from "#components/auth/email-change-form/email-change-form.tsx";

const meta = preview.meta({
  title: "Auth / EmailChangeForm",
  component: EmailChangeForm,
});

export const Default = meta.story();
