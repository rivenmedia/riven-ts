import { preview } from "@/.storybook/preview";

import { DateTime } from "luxon";
import { http, HttpResponse } from "msw";
import { expect, waitFor, within } from "storybook/test";

import { UserManagement } from "./user-management";

const meta = preview.meta({
  title: "Auth / UserManagement",
  component: UserManagement,
  beforeEach({ msw }) {
    msw.use(
      http.post("**/api/auth/admin/remove-user", () =>
        HttpResponse.json({ success: true }),
      ),
    );
  },
});

export const Default = meta.story({
  args: {
    currentUserId: "1",
    users: [
      {
        id: "1",
        name: "Alice Admin",
        email: "alice@example.com",
        username: "alice",
        role: "admin",
        banned: false,
        createdAt: DateTime.now().minus({ months: 2, weeks: 1 }).toJSDate(),
        updatedAt: DateTime.now().minus({ months: 1 }).toJSDate(),
        emailVerified: true,
        image: null,
        displayUsername: "username",
        banReason: null,
        banExpires: null,
      },
      {
        id: "2",
        name: "Bob Viewer",
        email: "bob@example.com",
        username: "bob",
        role: "user",
        banned: false,
        createdAt: DateTime.now().minus({ months: 1, weeks: 2 }).toJSDate(),
        updatedAt: DateTime.now().minus({ months: 1 }).toJSDate(),
        emailVerified: true,
        image: null,
        displayUsername: "username",
        banReason: null,
        banExpires: null,
      },
      {
        id: "3",
        name: "Charlie Manager",
        email: "charlie@example.com",
        username: "charlie",
        role: "manager",
        banned: false,
        createdAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
        updatedAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
        emailVerified: true,
        image: null,
        displayUsername: "username",
      },
    ],
  },
});

Default.test(
  "Shows a success toast when a user is deleted",
  async ({ canvas, canvasElement, userEvent }) => {
    const deleteButton = await canvas.findByRole("button", {
      name: /delete user: bob viewer/iu,
    });

    await userEvent.click(deleteButton);

    const body = within(canvasElement.ownerDocument.body);

    const dialog = within(
      await body.findByRole("alertdialog", {
        name: /are you sure\?/iu,
      }),
    );

    const confirmButton = await dialog.findByRole("button", {
      name: /confirm/iu,
    });

    await userEvent.click(confirmButton);

    const toastContainer = within(
      canvas.getByRole("region", { name: /notifications/iu }),
    );

    await waitFor(async () => {
      const toastItem = toastContainer.getByRole("listitem");

      await expect(toastItem).toHaveTextContent(/user deleted successfully/iu);
    });
  },
);

Default.test(
  "Shows an error toast when a user deletion fails",
  {
    beforeEach({ msw }) {
      msw.use(
        http.post("**/api/auth/admin/remove-user", () =>
          HttpResponse.json({ success: false }),
        ),
      );
    },
  },
  async ({ canvas, canvasElement, userEvent }) => {
    const deleteButton = await canvas.findByRole("button", {
      name: /delete user: bob viewer/iu,
    });

    await userEvent.click(deleteButton);

    const body = within(canvasElement.ownerDocument.body);

    const dialog = within(
      await body.findByRole("alertdialog", {
        name: /are you sure\?/iu,
      }),
    );

    const confirmButton = await dialog.findByRole("button", {
      name: /confirm/iu,
    });

    await userEvent.click(confirmButton);

    const toastContainer = within(
      canvas.getByRole("region", { name: /notifications/iu }),
    );

    await waitFor(async () => {
      const toastItem = toastContainer.getByRole("listitem");

      await expect(toastItem).toHaveTextContent(/failed to delete user/iu);
    });
  },
);

Default.test(
  "Does not show a toast when the user cancels the deletion",
  {
    beforeEach({ msw }) {
      msw.use(
        http.post("**/api/auth/admin/remove-user", () =>
          HttpResponse.json({ success: false }),
        ),
      );
    },
  },
  async ({ canvas, canvasElement, userEvent }) => {
    const deleteButton = await canvas.findByRole("button", {
      name: /delete user: bob viewer/iu,
    });

    await userEvent.click(deleteButton);

    const body = within(canvasElement.ownerDocument.body);

    const dialog = within(
      await body.findByRole("alertdialog", {
        name: /are you sure\?/iu,
      }),
    );

    const cancelButton = await dialog.findByRole("button", {
      name: /cancel/iu,
    });

    await userEvent.click(cancelButton);

    const toastContainer = within(
      canvas.getByRole("region", { name: /notifications/iu }),
    );

    await waitFor(
      async () => {
        const toastItems = toastContainer.queryAllByRole("listitem");

        await expect(toastItems).toHaveLength(0);
      },
      { timeout: 2000 },
    );
  },
);
