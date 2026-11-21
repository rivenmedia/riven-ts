import { DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import { expect, it as baseIt, vi } from "vitest";

import {
  loggedInActionClient,
  permissionActionClient,
} from "./action-client.ts";

const it = baseIt.extend("session", () => ({
  user: { id: "user-1" },
  session: { id: "session-1" },
}));

const auth = vi.hoisted(() => ({
  getSession: vi.fn<() => Promise<{ data: unknown }>>(),
  hasPermission:
    vi.fn<(input: { permissions: unknown }) => Promise<{ data: unknown }>>(),
}));

vi.mock(import("#lib/auth/client.ts"), () => ({
  authClient: {
    getSession: auth.getSession,
    admin: { hasPermission: auth.hasPermission },
  } as never,
}));

it.beforeEach(() => {
  auth.getSession.mockReset();
  auth.hasPermission.mockReset();
  vi.restoreAllMocks();
});

it("runs a logged-in action with the session in its context", async ({
  session,
}) => {
  auth.getSession.mockResolvedValue({ data: session });

  const action = loggedInActionClient.action(async ({ ctx }) =>
    Promise.resolve({ userId: ctx.auth.user.id }),
  );

  await expect(action()).resolves.toStrictEqual({
    data: { userId: "user-1" },
  });
});

it("rejects a logged-in action without a session", async () => {
  auth.getSession.mockResolvedValue({ data: null });

  // The default server error handler hides the cause from the client and only logs it
  const consoleErrorSpy = vi.spyOn(console, "error").mockReturnValue(undefined);
  const handler = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
  const result = await loggedInActionClient.action(handler)();

  expect(result.serverError).toBe(DEFAULT_SERVER_ERROR_MESSAGE);
  expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith(
    "Action error:",
    "User is not authenticated",
  );
  expect(result.data).toBeUndefined();
  expect(handler).not.toHaveBeenCalled();
});

it("runs a permission-checked action when the user has the permissions", async ({
  session,
}) => {
  auth.hasPermission.mockResolvedValue({ data: { success: true } });
  auth.getSession.mockResolvedValue({ data: session });

  const action = permissionActionClient
    .metadata({ permissions: { item: ["delete"] } })
    .action(async () => Promise.resolve("deleted"));

  await expect(action()).resolves.toStrictEqual({ data: "deleted" });

  expect(auth.hasPermission).toHaveBeenCalledExactlyOnceWith({
    permissions: { item: ["delete"] },
  });
});

it.for([
  { label: "is denied", data: { success: false } },
  { label: "cannot be checked", data: null },
])(
  "rejects a permission-checked action when the permission $label",
  async ({ data }, { session }) => {
    auth.hasPermission.mockResolvedValue({ data });
    auth.getSession.mockResolvedValue({ data: session });

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockReturnValue(undefined);
    const handler = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
    const result = await permissionActionClient
      .metadata({ permissions: { item: ["delete"] } })
      .action(handler)();

    expect(result.serverError).toBe(DEFAULT_SERVER_ERROR_MESSAGE);
    expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith(
      "Action error:",
      "User does not have the required permissions",
    );
    expect(handler).not.toHaveBeenCalled();
  },
);
