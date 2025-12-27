import { vi } from "vitest";

vi.mock<{ default: Record<string, unknown> }>(import("./package.json"), () => {
  return {
    default: {
      name: "riven",
      version: "1.0.0-mock",
      dependencies: {
        "@repo/plugin-test": "workspace:^",
      },
    },
  } as const;
});
