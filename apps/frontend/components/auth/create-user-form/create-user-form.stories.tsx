import { http, HttpResponse } from "msw";
import { expect, waitFor, within } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { CreateUserForm } from "#components/auth/create-user-form/create-user-form.tsx";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";

const meta = preview.meta({
  title: "Auth / CreateUserForm",
  component: CreateUserForm,
});

export const Default = meta.story({
  beforeEach({ msw }) {
    msw.use(
      createHasPermissionHandler({ user: ["create"] }),
      http.post("**/api/auth/admin/create-user", () =>
        HttpResponse.json({ success: true }),
      ),
    );
  },
});

Default.test(
  "Shows a success toast when the form is submitted with valid data",
  async ({ canvas, userEvent }) => {
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

    await userEvent.type(roleSelect, "user{Enter}");

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

Default.test(
  "Clears the form after successful submission",
  async ({ canvas, userEvent }) => {
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

    await userEvent.type(roleSelect, "user{Enter}");

    const createUserButton = await canvas.findByRole("button", {
      name: /create user/iu,
    });

    await expect(createUserButton).toBeEnabled();

    await userEvent.click(createUserButton);

    await waitFor(async () => {
      await expect(usernameInput).toHaveValue("");
      await expect(emailInput).toHaveValue("");
      await expect(passwordInput).toHaveValue("");
      await expect(confirmPasswordInput).toHaveValue("");
      await expect(roleSelect).toHaveValue("");
    });
  },
);
