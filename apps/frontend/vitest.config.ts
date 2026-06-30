import { baseVitestConfig } from "@repo/core-util-vitest-config/base";

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { type ViteUserConfig, defineConfig, mergeConfig } from "vitest/config";

export default defineConfig((config) => {
  const baseConfig = baseVitestConfig(config);

  return mergeConfig<typeof baseConfig, ViteUserConfig>(baseConfig, {
    plugins: [tsconfigPaths(), react()],
    test: {
      environment: "jsdom",
      exclude: [
        // Exclude Playwright test files
        "tests/**",
      ],
      setupFiles: ["./vitest.setup.ts"],
    },
  });
});
