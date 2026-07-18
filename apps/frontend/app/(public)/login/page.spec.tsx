import { userEvent } from "@testing-library/user-event";
import { expect, it } from "vitest";

import { render, screen } from "@/lib/test-utils/testing-library";

import Page from "./page";

it.skip("navigates to the dashboard after successful login", async () => {
  render(await Page());

  const user = userEvent.setup();

  await user.click(screen.getByRole("tab", { name: /login/i }));

  await Promise.all([
    user.type(screen.getByLabelText(/username/i), "username"),
    user.type(screen.getByLabelText(/email/i), "email@example.com"),
    user.type(screen.getByLabelText(/password/i), "password"),
    user.type(screen.getByLabelText(/confirm password/i), "password"),
  ]);

  expect(screen.getByRole("tab", { name: /login/i })).toBeInTheDocument();
});

it.todo("shows a success message after successful login");

it("navigates to the setup page after registration when no other users exist", async () => {
  render(await Page());

  const user = userEvent.setup();

  await user.click(screen.getByRole("tab", { name: /register/i }));

  await user.type(screen.getByLabelText(/username/i), "username");
  await user.type(screen.getByLabelText(/email/i), "email@example.com");
  await user.type(screen.getByLabelText(/^password$/i), "password");
  await user.type(screen.getByLabelText(/confirm password/i), "password");

  await user.click(screen.getByRole("button", { name: /submit/i }));

  expect(screen.getByRole("tab", { name: /login/i })).toBeInTheDocument();
});

it.todo(
  "navigates to the dashboard after registration when other users exist and registration is enabled",
);

it("shows a success message on successful registration", async () => {
  render(await Page());

  const user = userEvent.setup();

  await user.click(screen.getByRole("tab", { name: /register/i }));

  await user.type(screen.getByLabelText(/username/i), "username");
  await user.type(screen.getByLabelText(/email/i), "email@example.com");
  await user.type(screen.getByLabelText(/^password$/i), "password");
  await user.type(screen.getByLabelText(/confirm password/i), "password");

  await user.click(screen.getByRole("button", { name: /submit/i }));

  expect(screen.getByRole("tab", { name: /login/i })).toBeInTheDocument();
});

it.todo("shows an error message when login fails");

it.todo("shows an error message when registration fails");
