import preview from "@/.storybook/preview";

import { redirect } from "@storybook/nextjs-vite/navigation.mock";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, fn, spyOn } from "storybook/test";

import { LoginPage } from "./page.client";

const meta = preview.meta({
  title: "Pages / Login",
  component: LoginPage,
  beforeEach() {
    // oxlint-disable-next-line typescript/no-extraneous-class
    class PublicKeyCredentialMock {}

    spyOn(globalThis, "PublicKeyCredential", "get").mockReturnValue(
      PublicKeyCredentialMock as typeof PublicKeyCredential,
    );
  },
  parameters: {
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
});

export const CredentialsEnabled = meta.story({
  args: {
    authProviders: [
      {
        key: "credential",
        enabled: true,
        disableSignup: false,
      },
    ],
  },
});

CredentialsEnabled.test(
  "Shows a success message on successful login",
  {
    beforeEach({ msw }) {
      msw.use(
        http.post("**/api/auth/sign-in/username", () =>
          HttpResponse.json({ success: true }),
        ),
      );
    },
  },
  async ({ canvas, userEvent, step }) => {
    await step("Switch to the login tab", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: /login/iu }));

      await expect(
        await canvas.findByRole("tabpanel", { name: /login/iu }),
      ).toBeInTheDocument();
    });

    await step("Fill out the login form", async () => {
      await userEvent.type(screen.getByLabelText(/username/iu), "username");
      await userEvent.type(screen.getByLabelText(/^password$/iu), "password");
    });

    await step("Submit the login form", async () => {
      await userEvent.click(screen.getByRole("button", { name: /submit/iu }));
    });

    await expect(
      await screen.findByText(/login successful/iu),
    ).toBeInTheDocument();

    await expect(redirect).toBeCalledWith("/");
  },
);

CredentialsEnabled.test(
  "Shows an error message on failed login",
  {
    beforeEach({ msw }) {
      msw.use(
        http.post("**/api/auth/sign-in/username", () => HttpResponse.error()),
      );
    },
  },
  async ({ canvas, userEvent, step }) => {
    await step("Switch to the login tab", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: /login/iu }));

      await expect(
        await canvas.findByRole("tabpanel", { name: /login/iu }),
      ).toBeInTheDocument();
    });

    await step("Fill out the login form", async () => {
      await userEvent.type(screen.getByLabelText(/username/iu), "username");
      await userEvent.type(screen.getByLabelText(/^password$/iu), "password");
    });

    await step("Submit the login form", async () => {
      await userEvent.click(screen.getByRole("button", { name: /submit/iu }));
    });

    await expect(
      await screen.findByText(/an error occurred during login/iu),
    ).toBeInTheDocument();

    await expect(redirect).not.toBeCalled();
  },
);

CredentialsEnabled.test(
  "Shows a success message on successful registration",
  {
    beforeEach({ msw }) {
      msw.use(
        http.post("**/api/auth/sign-up/email", () =>
          HttpResponse.json({ success: true }),
        ),
      );
    },
  },
  async ({ canvas, userEvent, step }) => {
    await step("Switch to the register tab", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: /register/iu }));

      await expect(
        await canvas.findByRole("tabpanel", { name: /register/iu }),
      ).toBeInTheDocument();
    });

    await step("Fill out the registration form", async () => {
      await userEvent.type(screen.getByLabelText(/username/iu), "username");
      await userEvent.type(
        screen.getByLabelText(/email/iu),
        "email@example.com",
      );
      await userEvent.type(screen.getByLabelText(/^password$/iu), "password");
      await userEvent.type(
        screen.getByLabelText(/confirm password/iu),
        "password",
      );
    });

    await step("Submit the registration form", async () => {
      await userEvent.click(screen.getByRole("button", { name: /submit/iu }));
    });

    await expect(
      await screen.findByText(/registration successful/iu),
    ).toBeInTheDocument();

    await expect(redirect).toBeCalledWith("/");
  },
);

CredentialsEnabled.test(
  "Shows an error message on failed registration",
  {
    beforeEach({ msw }) {
      msw.use(
        http.post("**/api/auth/sign-up/email", () => HttpResponse.error()),
      );
    },
  },
  async ({ canvas, userEvent, step }) => {
    await step("Switch to the register tab", async () => {
      await userEvent.click(canvas.getByRole("tab", { name: /register/iu }));

      await expect(
        await canvas.findByRole("tabpanel", { name: /register/iu }),
      ).toBeInTheDocument();
    });

    await step("Fill out the registration form", async () => {
      await userEvent.type(screen.getByLabelText(/username/iu), "username");
      await userEvent.type(
        screen.getByLabelText(/email/iu),
        "email@example.com",
      );
      await userEvent.type(screen.getByLabelText(/^password$/iu), "password");
      await userEvent.type(
        screen.getByLabelText(/confirm password/iu),
        "password",
      );
    });

    await step("Submit the registration form", async () => {
      await userEvent.click(screen.getByRole("button", { name: /submit/iu }));
    });

    await expect(
      await screen.findByText(/an error occurred during registration/iu),
    ).toBeInTheDocument();

    await expect(redirect).not.toBeCalled();
  },
);

export const PasskeysUnsupported = meta.story({
  beforeEach() {
    spyOn(globalThis, "PublicKeyCredential", "get").mockReturnValue(
      undefined as never,
    );
  },
  args: {
    authProviders: [
      {
        key: "credential",
        enabled: true,
        disableSignup: false,
      },
      {
        key: "plex",
        enabled: true,
        disableSignup: false,
      },
    ],
  },
});

export const WithOAuthProviders = meta.story({
  name: "With OAuth Providers",
  args: {
    authProviders: [
      {
        key: "credential",
        enabled: true,
        disableSignup: false,
      },
      {
        key: "plex",
        enabled: true,
        disableSignup: false,
      },
    ],
  },
});

export const SignupDisabled = meta.story({
  args: {
    authProviders: [
      {
        key: "credential",
        enabled: true,
        disableSignup: true,
      },
    ],
  },
});
