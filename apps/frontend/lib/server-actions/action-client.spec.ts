import { expect, it, vi } from "vitest";

import {
  loggedInActionClient,
  permissionActionClient,
} from "./action-client.ts";

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

const session = { user: { id: "user-1" }, session: { id: "session-1" } };

it.beforeEach(() => {
  auth.getSession.mockReset();
  auth.hasPermission.mockReset();
});

it("runs a logged-in action with the session in its context", async () => {
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

  const handler = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
  const result = await loggedInActionClient.action(handler)();

  expect(result.serverError).toBeDefined();
  expect(result.data).toBeUndefined();
  expect(handler).not.toHaveBeenCalled();
});

it("runs a permission-checked action when the user has the permissions", async () => {
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
  async ({ data }) => {
    auth.hasPermission.mockResolvedValue({ data });
    auth.getSession.mockResolvedValue({ data: session });

    const handler = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
    const result = await permissionActionClient
      .metadata({ permissions: { item: ["delete"] } })
      .action(handler)();

    expect(result.serverError).toBeDefined();
    expect(handler).not.toHaveBeenCalled();
  },
);
