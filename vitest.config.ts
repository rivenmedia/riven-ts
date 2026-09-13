import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import { defineConfig, mergeConfig } from "vitest/config";

import type { ViteUserConfigExport } from "vitest/config";

export default defineConfig((config) =>
  mergeConfig<ViteUserConfigExport, ViteUserConfigExport>(
    baseVitestConfig(config),
    {
      test: {
        projects: ["packages/*", "apps/*"],
      },
    },
  ),
);
