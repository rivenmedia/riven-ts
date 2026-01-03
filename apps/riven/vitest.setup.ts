import { vi } from "vitest";

vi.mock<{ default: Record<string, unknown> }>(
  import("./package.json"),
  () =>
    ({
      default: {
        name: "riven",
        version: "1.0.0-mock",
        dependencies: {
          "@repo/plugin-test": "workspace:^",
        },
      },
    }) as const,
);

vi.mock<typeof import("@apollo/server/standalone")>(
  import("@apollo/server/standalone"),
  () => ({
    startStandaloneServer: vi.fn().mockResolvedValue({
      url: "http://localhost:4000/mocked-server",
    }),
  }),
);
