import { preview } from "@/.storybook/preview";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { CreateUserForm } from "./create-user-form";

const meta = preview.meta({
  title: "Auth / CreateUserForm",
  component: CreateUserForm,
});

export const Default = meta.story();

Default.test(
  "Shows a success toast when the form is submitted with valid data",
  async ({ canvas }) => {
    const usernameInput = await canvas.findByRole("textbox", {
      name: /username/iu,
    });
    const emailInput = await canvas.findByRole("textbox", { name: /email/iu });
    const passwordInput = await canvas.findByLabelText(/^password/iu);
    const confirmPasswordInput =
      await canvas.findByLabelText(/confirm password/iu);
    const roleSelect = await canvas.findByRole("combobox", {
      name: /role/iu,
      hidden: true,
    });

    await userEvent.type(usernameInput, "testuser");
    await userEvent.type(emailInput, "user@example.com");
    await userEvent.type(passwordInput, "Password123!");
    await userEvent.type(confirmPasswordInput, "Password123!");

    await userEvent.type(roleSelect, "user{enter}");

    const createUserButton = await canvas.findByRole("button", {
      name: /create user/iu,
    });

    await expect(createUserButton).toBeEnabled();

    await userEvent.click(createUserButton);

    const toastContainer = within(
      canvas.getByRole("region", { name: /notifications/iu }),
    );

    await waitFor(async () => {
      const toastItem = toastContainer.getByRole("listitem");

      await expect(toastItem).toHaveTextContent(/user created successfully/iu);
    });
  },
);
