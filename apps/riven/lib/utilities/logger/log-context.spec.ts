import { describe, expect, it, vi } from "vitest";

vi.mock("@sentry/node", () => ({
  withScope: vi.fn((callback) => callback({ setTags: vi.fn() })),
}));

vi.mock("node:worker_threads", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:worker_threads")>();
  return {
    ...actual,
    getEnvironmentData: vi
      .fn()
      .mockReturnValue("550e8400-e29b-41d4-a716-446655440000"),
  };
});

const { getLogContext, withLogContext } = await import("./log-context.ts");

describe("log-context", () => {
  it("withLogContext runs callback with context", () => {
    const result = withLogContext({ "riven.log.source": "test" }, () => {
      const ctx = getLogContext();
      return ctx["riven.log.source"];
    });

    expect(result).toBe("test");
  });

  it("getLogContext throws when no context", () => {
    expect(() => getLogContext()).toThrow("No log context available");
  });

  it("merges nested contexts", () => {
    withLogContext({ "riven.log.source": "outer" }, () => {
      const result = withLogContext(
        { "riven.plugin.name": "inner-plugin" },
        () => {
          const ctx = getLogContext();
          return ctx;
        },
      );

      expect(result).toMatchObject({
        "riven.log.source": "outer",
        "riven.plugin.name": "inner-plugin",
      });
    });
  });
});
