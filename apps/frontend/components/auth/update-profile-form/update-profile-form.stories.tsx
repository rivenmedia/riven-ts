import { preview } from "@/.storybook/preview";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { UpdateProfileForm } from "./update-profile-form";

const meta = preview.meta({
  title: "Auth / UpdateProfileForm",
  component: UpdateProfileForm,
});

export const Default = meta.story({
  args: {
    data: {
      name: "",
      username: "",
      avatar: "",
    },
  },
});

Default.test(
  "Shows a toast when the form is successfully submitted",
  async ({ canvas }) => {
    const form = within(canvas.getByRole("form", { name: /update profile/iu }));

    const usernameInput = form.getByRole("textbox", { name: /username/iu });
    const nameInput = form.getByRole("textbox", { name: /^name/iu });
    const avatarInput = form.getByRole("textbox", { name: /avatar/iu });

    await userEvent.type(usernameInput, "johndoe");
    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(avatarInput, "https://example.com/avatar.jpg");

    const submitButton = form.getByRole("button", { name: /update profile/iu });

    await userEvent.click(submitButton);

    await expect(submitButton).toBeDisabled();
    await expect(usernameInput).toBeDisabled();
    await expect(nameInput).toBeDisabled();
    await expect(avatarInput).toBeDisabled();

    const toastContainer = within(
      canvas.getByRole("region", { name: /notifications/iu }),
    );

    await waitFor(async () => {
      const toastItem = toastContainer.getByRole("listitem");

      await expect(toastItem).toHaveTextContent(
        /profile updated successfully/iu,
      );
    });
  },
);
