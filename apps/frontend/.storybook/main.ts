import { defineMain } from "@storybook/nextjs-vite/node";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineMain({
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
    "@chromatic-com/storybook",
  ],
  stories: ["../{app,components,lib}/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  features: {
    experimentalCodeExamples: true,
    experimentalTestSyntax: true,
  },
  async viteFinal(config) {
    const { defineConfig, mergeConfig } = await import("vite");

    return mergeConfig(
      config,
      defineConfig({
        plugins: [
          nodePolyfills({
            include: [
              "assert", // Allows the use of assert.ok in interaction tests
            ],
          }),
        ],
      }),
    );
  },
});
