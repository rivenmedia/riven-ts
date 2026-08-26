import { preview } from "@/.storybook/preview";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { PasswordChangeForm } from "./password-change-form";

const meta = preview.meta({
  title: "Auth / PasswordChangeForm",
  component: PasswordChangeForm,
});

export const Default = meta.story();

Default.test("Renders correctly", async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  await expect(
    await canvas.findByRole("heading", {
      level: 1,
      name: "Change Password",
    }),
  ).toBeInTheDocument();
});

Default.test(
  '"Change Password" button is disabled when form is pristine',
  async ({ canvas }) => {
    await expect(
      await canvas.findByRole("button", {
        name: /change password/iu,
      }),
    ).toBeDisabled();
  },
);

Default.test(
  'Clicking the visibility toggle button changes the input type between "text" and "password"',
  async ({ canvas }) => {
    const testCases = [
      /current password/iu,
      /^new password/iu,
      /confirm new password/iu,
    ];

    for (const testCase of testCases) {
      const input = await canvas.findByLabelText(testCase);

      await userEvent.type(input, "TestPassword123!");

      await expect(input).toHaveAttribute("type", "password");

      if (!input.parentElement) {
        throw new Error("Input does not have a parent element");
      }

      const toggleButton = await within(input.parentElement).findByRole(
        "button",
        {
          name: /toggle password visibility/iu,
          hidden: true,
        },
      );

      await userEvent.click(toggleButton);

      await expect(input).toHaveAttribute("type", "text");

      await userEvent.click(toggleButton);

      await expect(input).toHaveAttribute("type", "password");
    }
  },
);

Default.test(
  "Shows a success toast when the form is submitted with valid data",
  async ({ canvas }) => {
    const currentPasswordInput =
      await canvas.findByLabelText(/current password/iu);
    const newPasswordInput = await canvas.findByLabelText(/^new password/iu);
    const confirmNewPasswordInput =
      await canvas.findByLabelText(/confirm new password/iu);

    await userEvent.type(currentPasswordInput, "CurrentPassword123!");
    await userEvent.type(newPasswordInput, "NewPassword123!");
    await userEvent.type(confirmNewPasswordInput, "NewPassword123!");

    const changePasswordButton = await canvas.findByRole("button", {
      name: /change password/iu,
    });

    await expect(changePasswordButton).toBeEnabled();

    await userEvent.click(changePasswordButton);

    const toastContainer = within(
      canvas.getByRole("region", { name: /notifications/iu }),
    );

    await waitFor(async () => {
      const toastItem = toastContainer.getByRole("listitem");

      await expect(toastItem).toHaveTextContent(
        /password changed successfully/iu,
      );
    });
  },
);
