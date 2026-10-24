import { preview } from "#.storybook/preview.tsx";
import { ChangeEmailForm } from "#components/auth/change-email-form/change-email-form.tsx";

const meta = preview.meta({
  title: "Auth / ChangeEmailForm",
  component: ChangeEmailForm,
});

export const Default = meta.story();
