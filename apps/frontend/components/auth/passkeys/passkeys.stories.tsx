import { preview } from "@/.storybook/preview";

import { StatusCodes } from "http-status-codes";
import { DateTime } from "luxon";
import { delay, http, HttpResponse } from "msw";
import {
  expect,
  fn,
  spyOn,
  userEvent,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "storybook/test";

import { PasskeyFormProvider } from "./passkey-form-provider";
import { Passkeys } from "./passkeys";

import type { Passkey } from "@better-auth/passkey/client";
import type { PathParams } from "msw";

const meta = preview.meta({
  title: "Auth / Passkeys",
  component: Passkeys,
  decorators: [
    (Story) => (
      <PasskeyFormProvider>
        <Story />
      </PasskeyFormProvider>
    ),
  ],
  beforeEach({ msw }) {
    spyOn(navigator, "credentials", "get").mockReturnValue({
      get: fn(),
      preventSilentAccess: fn(),
      store: fn(),
      async create() {
        const textDecoder = new TextDecoder();

        const rawId = new ArrayBuffer(16);
        const clientDataJSON = new ArrayBuffer(16);

        return Promise.resolve<PublicKeyCredential>({
          id: "new-passkey-id",
          type: "public-key",
          rawId,
          authenticatorAttachment: null,
          response: {
            clientDataJSON,
          },
          getClientExtensionResults() {
            return {};
          },
          toJSON() {
            return {
              clientExtensionResults: {},
              id: "new-passkey-id",
              rawId: textDecoder.decode(rawId),
              response: {
                clientDataJSON: textDecoder.decode(clientDataJSON),
                attestationObject: textDecoder.decode(new ArrayBuffer(16)),
                authenticatorData: "",
                signature: "",
                publicKeyAlgorithm: -7,
              },
              type: "public-key",
            };
          },
        });
      },
    });

    msw.use(
      http.post("**/api/auth/passkey/update-passkey", async () => {
        await delay();

        return HttpResponse.json();
      }),
      http.post("**/api/auth/passkey/add-passkey", async () => {
        await delay();

        return HttpResponse.json();
      }),
      http.get("**/api/auth/passkey/generate-register-options", () =>
        HttpResponse.json(),
      ),
      http.post("**/api/auth/passkey/delete-passkey", async () => {
        await delay();

        return HttpResponse.json();
      }),
      http.post("**/api/auth/passkey/verify-registration", async () => {
        await delay();

        return HttpResponse.json();
      }),
    );
  },
});

export const Default = meta.story({
  beforeEach: ({ msw }) => {
    msw.use(
      http.get("**/api/auth/passkey/list-user-passkeys", () =>
        HttpResponse.json<Passkey[]>([
          {
            name: "My First Passkey",
            id: "passkey-1",
            createdAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
            backedUp: true,
            counter: 1,
            credentialID: "credential-id-1",
            deviceType: "singleDevice",
            publicKey: "public-key-1",
            userId: "user-id-1",
          },
          {
            name: "My Second Passkey",
            id: "passkey-2",
            createdAt: DateTime.now().minus({ days: 3 }).toJSDate(),
            backedUp: true,
            counter: 1,
            credentialID: "credential-id-2",
            deviceType: "singleDevice",
            publicKey: "public-key-2",
            userId: "user-id-1",
          },
        ]),
      ),
    );
  },
});

Default.test(
  "Updates the passkey name when the form is submitted",
  {
    beforeEach: ({ msw }) => {
      msw.use(
        http.get("**/api/auth/passkey/list-user-passkeys", () =>
          HttpResponse.json<Passkey[]>([
            {
              id: "passkey-1",
              createdAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
              backedUp: true,
              counter: 1,
              credentialID: "credential-id-1",
              deviceType: "singleDevice",
              publicKey: "public-key-1",
              userId: "user-id-1",
            },
          ]),
        ),
        http.post<PathParams, { id: string; name: string }>(
          "**/api/auth/passkey/update-passkey",
          async ({ request }) => {
            // await delay();

            const body = await request.json();

            if (!body.name) {
              return HttpResponse.json(
                { error: "Passkey name is required" },
                { status: StatusCodes.BAD_REQUEST },
              );
            }

            return HttpResponse.json();
          },
        ),
      );
    },
  },
  async ({ canvas, msw, step }) => {
    await step("Wait for the passkeys to load", async () => {
      await waitForElementToBeRemoved(() =>
        canvas.queryByText(/loading passkeys/iu),
      );
    });

    const updatedPasskeyName = "Updated Passkey Name";

    msw.use(
      http.get("**/api/auth/passkey/list-user-passkeys", () =>
        HttpResponse.json<Passkey[]>([
          {
            name: updatedPasskeyName,
            id: "passkey-1",
            createdAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
            backedUp: true,
            counter: 1,
            credentialID: "credential-id-1",
            deviceType: "singleDevice",
            publicKey: "public-key-1",
            userId: "user-id-1",
          },
        ]),
      ),
    );

    await step(
      "Edit the name of the passkey and verify the update",
      async () => {
        const editButton = await canvas.findByRole("button", {
          name: /edit passkey name/iu,
        });

        await userEvent.click(editButton);

        const input =
          await canvas.findByPlaceholderText(/enter passkey name/iu);

        await userEvent.type(input, updatedPasskeyName);

        await expect(input).toHaveValue(updatedPasskeyName);

        const saveButton = await canvas.findByRole("button", {
          name: /save passkey name/iu,
        });

        await userEvent.click(saveButton);

        await expect(saveButton).toBeDisabled();

        await waitForElementToBeRemoved(() =>
          canvas.queryByRole("button", { name: /save passkey name/iu }),
        );

        const updatedPasskey = await canvas.findByText(updatedPasskeyName);

        await expect(updatedPasskey).toBeInTheDocument();

        const toastContainer = within(
          canvas.getByRole("region", { name: /notifications/iu }),
        );

        await waitFor(async () => {
          const toastItem = toastContainer.getByRole("listitem");

          await expect(toastItem).toHaveTextContent(
            /passkey name updated successfully/iu,
          );
        });
      },
    );
  },
);

Default.test(
  "Cancels editing the passkey name when the cancel button is clicked",
  {
    beforeEach({ msw }) {
      msw.use(
        http.get("**/api/auth/passkey/list-user-passkeys", () =>
          HttpResponse.json<Passkey[]>([
            {
              name: "My First Passkey",
              id: "passkey-1",
              createdAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
              backedUp: true,
              counter: 1,
              credentialID: "credential-id-1",
              deviceType: "singleDevice",
              publicKey: "public-key-1",
              userId: "user-id-1",
            },
          ]),
        ),
      );
    },
  },
  async ({ canvas, step }) => {
    await step("Wait for the passkeys to load", async () => {
      await waitForElementToBeRemoved(() =>
        canvas.queryByText(/loading passkeys/iu),
      );
    });

    await step("Edit the name of the passkey", async () => {
      const editButton = await canvas.findByRole("button", {
        name: /edit passkey name/iu,
      });

      await userEvent.click(editButton);

      const input = await canvas.findByPlaceholderText(/enter passkey name/iu);

      await expect(input).toHaveValue("My First Passkey");

      await userEvent.clear(input);

      await userEvent.type(input, "Updated Passkey Name");
    });

    await step(
      "Cancel editing the passkey name and verify the original name is displayed",
      async () => {
        const cancelButton = await canvas.findByRole("button", {
          name: /cancel editing passkey name/iu,
        });

        await userEvent.click(cancelButton);

        await expect(cancelButton).not.toBeInTheDocument();

        const originalPasskeyName = canvas.getByText(/my first passkey/iu);

        await expect(originalPasskeyName).toBeInTheDocument();
      },
    );
  },
);

Default.test(
  "Deletes a passkey when the delete button is clicked",
  {
    beforeEach: ({ msw }) => {
      msw.use(
        http.get("**/api/auth/passkey/list-user-passkeys", () =>
          HttpResponse.json<Passkey[]>([
            {
              name: "My First Passkey",
              id: "passkey-1",
              createdAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
              backedUp: true,
              counter: 1,
              credentialID: "credential-id-1",
              deviceType: "singleDevice",
              publicKey: "public-key-1",
              userId: "user-id-1",
            },
          ]),
        ),
      );
    },
  },
  async ({ canvas, msw, step }) => {
    await step("Wait for the passkeys to load", async () => {
      await waitForElementToBeRemoved(() =>
        canvas.queryByText(/loading passkeys/iu),
      );
    });

    msw.use(
      http.get("**/api/auth/passkey/list-user-passkeys", () =>
        HttpResponse.json<Passkey[]>([]),
      ),
    );

    await step("Delete the passkey and verify it is removed", async () => {
      const deleteButton = await canvas.findByRole("button", {
        name: /delete passkey/iu,
      });

      await userEvent.click(deleteButton);

      await waitForElementToBeRemoved(() =>
        canvas.queryByText(/my first passkey/iu),
      );

      const noPasskeysMessage = await canvas.findByText(
        /no passkeys registered yet/iu,
      );

      await expect(noPasskeysMessage).toBeInTheDocument();

      const toastContainer = within(
        canvas.getByRole("region", { name: /notifications/iu }),
      );

      await waitFor(async () => {
        const toastItem = toastContainer.getByRole("listitem");

        await expect(toastItem).toHaveTextContent(
          /passkey deleted successfully/iu,
        );
      });
    });
  },
);

Default.test(
  "Displays an error message when the passkey list fails to load",
  {
    beforeEach: ({ msw }) => {
      msw.use(
        http.get("**/api/auth/passkey/list-user-passkeys", () =>
          HttpResponse.json<Passkey[]>([], { status: 500 }),
        ),
      );
    },
  },
  async ({ canvas, step }) => {
    await step("Wait for the passkeys to load", async () => {
      await waitForElementToBeRemoved(() =>
        canvas.queryByText(/loading passkeys/iu),
      );
    });

    const errorMessage = await canvas.findByText(/failed to load passkeys/iu);

    await expect(errorMessage).toBeInTheDocument();
  },
);

Default.test(
  'Adds a passkey when the "Add Passkey" button is clicked',
  {
    beforeEach: ({ msw }) => {
      msw.use(
        http.get("**/api/auth/passkey/list-user-passkeys", () =>
          HttpResponse.json<Passkey[]>([]),
        ),
        http.get("**/api/auth/passkey/generate-register-options", () =>
          HttpResponse.json({
            rp: {
              id: "localhost",
              name: "Mock Passkey",
            },
            user: {
              id: "tNkCHrJCLUst1P6JCxIIYA",
              name: "demo-user",
              displayName: "demo-user",
            },
            challenge: "ioqExiAgz7prAO1mTZlP01prO9gTrJsXfUfImctuKYs",
            pubKeyCredParams: [
              {
                type: "public-key",
                alg: -7,
              },
            ],
            timeout: 60_000,
            authenticatorSelection: {
              userVerification: "preferred",
              residentKey: "preferred",
            },
            attestation: "none",
          }),
        ),
      );
    },
  },
  async ({ canvas, step, msw }) => {
    await step("Wait for the passkeys to load", async () => {
      await waitForElementToBeRemoved(() =>
        canvas.queryByText(/loading passkeys/iu),
      );
    });

    msw.use(
      http.get("**/api/auth/passkey/list-user-passkeys", () =>
        HttpResponse.json<Passkey[]>([
          {
            name: "Mock Passkey",
            id: "passkey-1",
            createdAt: DateTime.now().minus({ weeks: 1 }).toJSDate(),
            backedUp: true,
            counter: 1,
            credentialID: "credential-id-1",
            deviceType: "singleDevice",
            publicKey: "public-key-1",
            userId: "user-id-1",
          },
        ]),
      ),
    );

    await step("Add a new passkey and verify it has been added", async () => {
      const addPasskeyButton = await canvas.findByRole("button", {
        name: /add passkey/iu,
      });

      await userEvent.click(addPasskeyButton);

      await expect(addPasskeyButton).toBeDisabled();

      await expect(addPasskeyButton).toHaveTextContent(/registering.../iu);
    });

    await step("Verify the new passkey is displayed in the list", async () => {
      const newPasskey = await canvas.findByText(/mock passkey/iu);

      await expect(newPasskey).toBeInTheDocument();

      const toastContainer = within(
        canvas.getByRole("region", { name: /notifications/iu }),
      );

      await waitFor(async () => {
        const toastItem = toastContainer.getByRole("listitem");

        await expect(toastItem).toHaveTextContent(
          /passkey registered successfully/iu,
        );
      });
    });
  },
);
